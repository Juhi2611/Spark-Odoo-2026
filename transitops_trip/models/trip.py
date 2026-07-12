# -*- coding: utf-8 -*-
from odoo import models, fields, api
from odoo.exceptions import ValidationError, UserError


class Trip(models.Model):
    """Core trip model for TransitOps fleet management.

    Lifecycle
    ---------
    Draft ──► Dispatched ──► Completed
                    │
                    └──► Cancelled

    Status cascades
    ---------------
    • Dispatch   → vehicle.status = 'on_trip',  driver.status = 'on_trip'
    • Complete   → vehicle.status = 'available', driver.status = 'available'
    • Cancel     → vehicle.status = 'available', driver.status = 'available'
                   (only if the vehicle/driver was flipped by THIS trip)
    """

    _name = 'transitops.trip'
    _description = 'Trip'
    _order = 'dispatched_at desc, created_at desc, id desc'
    _rec_name = 'name'

    # ── Identification ──────────────────────────────────────────────────────
    name = fields.Char(
        string='Trip Reference',
        required=True,
        copy=False,
        readonly=True,
        default=lambda self: 'New',
        help='Auto-generated sequence (TRP-XXXX)',
    )

    # ── Relationships ───────────────────────────────────────────────────────
    vehicle_id = fields.Many2one(
        comodel_name='transitops.vehicle',
        string='Vehicle',
        required=True,
        ondelete='restrict',
        index=True,
        help='Only available vehicles can be dispatched on a trip.',
    )

    driver_id = fields.Many2one(
        comodel_name='transitops.driver',
        string='Driver',
        required=True,
        ondelete='restrict',
        index=True,
        help='Only available drivers can be assigned to a trip.',
    )

    # ── Route Details ───────────────────────────────────────────────────────
    source = fields.Char(
        string='Origin',
        required=True,
        help='Starting location of the trip.',
    )

    destination = fields.Char(
        string='Destination',
        required=True,
        help='Ending location of the trip.',
    )

    planned_distance = fields.Float(
        string='Planned Distance (km)',
        digits=(10, 2),
        required=True,
        help='Estimated one-way distance in kilometres.',
    )

    # ── Cargo ───────────────────────────────────────────────────────────────
    cargo_weight = fields.Float(
        string='Cargo Weight (kg)',
        digits=(10, 2),
        required=True,
        help='Must not exceed the selected vehicle\'s max load capacity.',
    )

    # ── Convenience: related vehicle capacity (read-only, for UI display) ──
    vehicle_max_load = fields.Float(
        string='Vehicle Max Load (kg)',
        related='vehicle_id.max_load_capacity',
        readonly=True,
        store=False,
        help='Pulled from the vehicle record for quick reference.',
    )

    # ── Timing ──────────────────────────────────────────────────────────────
    departure_date = fields.Datetime(
        string='Planned Departure',
        help='Planned departure date and time.',
    )

    arrival_date = fields.Datetime(
        string='Planned Arrival',
        help='Planned arrival date and time.',
    )

    # ── Completion Metrics (filled on Complete) ──────────────────────────
    final_odometer = fields.Float(
        string='Final Odometer (km)',
        digits=(10, 1),
        help='Odometer reading recorded when completing the trip.',
    )

    fuel_consumed = fields.Float(
        string='Fuel Consumed (L)',
        digits=(10, 2),
        help='Total fuel consumed on this trip.',
    )

    # ── Status & Audit Timestamps ──────────────────────────────────────────
    status = fields.Selection(
        selection=[
            ('draft',      'Draft'),
            ('dispatched', 'Dispatched'),
            ('completed',  'Completed'),
            ('cancelled',  'Cancelled'),
        ],
        string='Status',
        required=True,
        default='draft',
        tracking=True,
        index=True,
        copy=False,
    )

    created_at = fields.Datetime(
        string='Created At',
        default=fields.Datetime.now,
        readonly=True,
        copy=False,
    )

    dispatched_at = fields.Datetime(
        string='Dispatched At',
        readonly=True,
        copy=False,
    )

    completed_at = fields.Datetime(
        string='Completed At',
        readonly=True,
        copy=False,
    )

    notes = fields.Text(
        string='Notes',
    )

    # ────────────────────────────────────────────────────────────────────────
    # ORM Overrides
    # ────────────────────────────────────────────────────────────────────────

    @api.model_create_multi
    def create(self, vals_list):
        """Auto-assign TRP-XXXX sequence on creation."""
        for vals in vals_list:
            if vals.get('name', 'New') == 'New':
                vals['name'] = (
                    self.env['ir.sequence'].next_by_code('transitops.trip')
                    or 'New'
                )
        return super().create(vals_list)

    # ────────────────────────────────────────────────────────────────────────
    # Constraints
    # ────────────────────────────────────────────────────────────────────────

    @api.constrains('arrival_date', 'departure_date')
    def _check_dates(self):
        """Arrival must be strictly after departure when both are set."""
        for rec in self:
            if rec.departure_date and rec.arrival_date:
                if rec.arrival_date <= rec.departure_date:
                    raise ValidationError(
                        "Planned Arrival must be after Planned Departure "
                        f"(trip {rec.name})."
                    )

    @api.constrains('cargo_weight', 'vehicle_id')
    def _check_cargo_weight(self):
        """Cargo weight must not exceed the vehicle's max load capacity."""
        for rec in self:
            if not rec.vehicle_id:
                continue
            capacity = rec.vehicle_id.max_load_capacity
            if capacity and rec.cargo_weight > capacity:
                raise ValidationError(
                    f"Cargo weight {rec.cargo_weight:.1f} kg exceeds "
                    f"{rec.vehicle_id.name}'s max load capacity of "
                    f"{capacity:.1f} kg (trip {rec.name})."
                )

    # ────────────────────────────────────────────────────────────────────────
    # Internal Helpers
    # ────────────────────────────────────────────────────────────────────────

    def _check_vehicle_availability(self):
        """Raise UserError if the vehicle is already On Trip or in maintenance."""
        for rec in self:
            v = rec.vehicle_id
            if v.status == 'on_trip':
                raise UserError(
                    f"Vehicle {v.name} is already On Trip and cannot be "
                    f"assigned to another trip (trip {rec.name})."
                )
            if v.status in ('in_shop', 'retired'):
                raise UserError(
                    f"Vehicle {v.name} has status '{v.status}' and cannot "
                    f"be dispatched (trip {rec.name})."
                )

    def _check_driver_availability(self):
        """Raise UserError if the driver is already On Trip or suspended."""
        for rec in self:
            d = rec.driver_id
            if d.status == 'on_trip':
                raise UserError(
                    f"Driver {d.name} is already On Trip and cannot be "
                    f"assigned to another trip (trip {rec.name})."
                )
            if d.status == 'suspended':
                raise UserError(
                    f"Driver {d.name} is suspended and cannot be dispatched "
                    f"(trip {rec.name})."
                )
            # Expired license check (requires license_expiry_date on driver)
            expiry = d.license_expiry_date
            if expiry and expiry < fields.Date.today():
                raise UserError(
                    f"Driver {d.name}'s license expired on {expiry} and "
                    f"cannot be dispatched (trip {rec.name})."
                )

    # ────────────────────────────────────────────────────────────────────────
    # Action Methods (called from statusbar buttons in views)
    # ────────────────────────────────────────────────────────────────────────

    def action_dispatch(self):
        """Draft → Dispatched.

        Validates capacity, vehicle, and driver availability, then
        cascades both vehicle and driver status to 'on_trip'.
        """
        for rec in self:
            if rec.status != 'draft':
                raise UserError(
                    f"Only Draft trips can be dispatched (trip {rec.name} "
                    f"is '{rec.status}')."
                )
            # Business rule validations
            rec._check_cargo_weight()
            rec._check_vehicle_availability()
            rec._check_driver_availability()

            # ── Status cascade ──────────────────────────────────────────
            rec.vehicle_id.write({'status': 'on_trip'})
            rec.driver_id.write({'status': 'on_trip'})

            rec.write({
                'status': 'dispatched',
                'dispatched_at': fields.Datetime.now(),
            })

    def action_complete(self):
        """Dispatched → Completed.

        Restores vehicle and driver status to 'available'.
        """
        for rec in self:
            if rec.status != 'dispatched':
                raise UserError(
                    f"Only Dispatched trips can be completed (trip {rec.name} "
                    f"is '{rec.status}')."
                )

            # ── Status cascade ──────────────────────────────────────────
            # Only restore if the vehicle is still 'on_trip' (guard against
            # rare manual edits).
            if rec.vehicle_id.status == 'on_trip':
                rec.vehicle_id.write({'status': 'available'})
            if rec.driver_id.status == 'on_trip':
                rec.driver_id.write({'status': 'available'})

            rec.write({
                'status': 'completed',
                'completed_at': fields.Datetime.now(),
            })

    def action_cancel(self):
        """Draft/Dispatched → Cancelled.

        If the trip was dispatched, restores vehicle and driver to 'available'.
        """
        for rec in self:
            if rec.status in ('completed', 'cancelled'):
                raise UserError(
                    f"Completed or already-cancelled trips cannot be cancelled "
                    f"(trip {rec.name})."
                )

            # ── Status cascade (only if we previously flipped them) ───────
            if rec.status == 'dispatched':
                if rec.vehicle_id.status == 'on_trip':
                    rec.vehicle_id.write({'status': 'available'})
                if rec.driver_id.status == 'on_trip':
                    rec.driver_id.write({'status': 'available'})

            rec.write({'status': 'cancelled'})

    def action_reset_draft(self):
        """Cancelled → Draft (for correcting a wrongly cancelled trip)."""
        for rec in self:
            if rec.status != 'cancelled':
                raise UserError(
                    f"Only Cancelled trips can be reset to Draft "
                    f"(trip {rec.name})."
                )
            rec.write({
                'status': 'draft',
                'dispatched_at': False,
                'completed_at': False,
            })
