# -*- coding: utf-8 -*-
from odoo import models, fields, api


class MaintenanceRequest(models.Model):
    """Track maintenance work orders for fleet vehicles."""

    _name = 'transitops.maintenance.request'
    _description = 'Maintenance Request'
    _order = 'date_opened desc, id desc'
    _rec_name = 'name'

    # ── Identification ──────────────────────────────────────
    name = fields.Char(
        string='Reference',
        required=True,
        copy=False,
        readonly=True,
        default=lambda self: 'New',
        help='Auto-generated sequence (MNT-XXXX)',
    )

    # ── Relationships ───────────────────────────────────────
    vehicle_id = fields.Many2one(
        comodel_name='transitops.vehicle',
        string='Vehicle',
        required=True,
        ondelete='restrict',
        index=True,
    )

    # ── Details ─────────────────────────────────────────────
    maintenance_type = fields.Selection(
        selection=[
            ('engine_overhaul', 'Engine Overhaul'),
            ('brake_pad', 'Brake Pad Replacement'),
            ('oil_change', 'Oil Change & Filter'),
            ('tire_replacement', 'Tire Replacement'),
            ('general', 'General Service'),
        ],
        string='Maintenance Type',
        required=True,
        default='general',
    )

    date_opened = fields.Date(
        string='Date Opened',
        required=True,
        default=fields.Date.today,
        index=True,
    )

    date_closed = fields.Date(
        string='Date Closed',
        help='Automatically set when status changes to Closed',
    )

    status = fields.Selection(
        selection=[
            ('open', 'Open'),
            ('closed', 'Closed'),
        ],
        string='Status',
        required=True,
        default='open',
        tracking=True,
    )

    cost = fields.Float(
        string='Cost (₹)',
        digits=(12, 2),
        help='Estimated or actual maintenance cost',
    )

    notes = fields.Text(
        string='Notes',
    )

    # ── Business Logic ──────────────────────────────────────

    @api.model_create_multi
    def create(self, vals_list):
        """Assign auto-sequence on creation and cascade vehicle status.

        When a maintenance record is created with status 'open', the linked
        vehicle is automatically switched to 'in_shop' so it disappears from
        the dispatch pool.  This is a core hackathon demo requirement.
        """
        for vals in vals_list:
            if vals.get('name', 'New') == 'New':
                vals['name'] = self.env['ir.sequence'].next_by_code(
                    'transitops.maintenance.request'
                ) or 'New'

        records = super().create(vals_list)

        # ── Cascade: open maintenance → vehicle goes "in_shop" ──
        for rec in records:
            if rec.status == 'open' and rec.vehicle_id:
                rec.vehicle_id.write({'status': 'in_shop'})

        return records

    def write(self, vals):
        """Handle status transitions and cascade vehicle status.

        • open → closed : vehicle restored to 'available' (unless 'retired'),
                          date_closed auto-filled.
        • closed → open : vehicle switched back to 'in_shop'.
        """
        new_status = vals.get('status')

        # Auto-fill date_closed when closing
        if new_status == 'closed' and not vals.get('date_closed'):
            vals['date_closed'] = fields.Date.today()

        # Clear date_closed when re-opening
        if new_status == 'open':
            vals.setdefault('date_closed', False)

        result = super().write(vals)

        # ── Cascade vehicle status after write ──────────────
        if new_status:
            for rec in self:
                if not rec.vehicle_id:
                    continue
                if new_status == 'closed':
                    # Restore vehicle to 'available' unless it's retired
                    if rec.vehicle_id.status != 'retired':
                        rec.vehicle_id.write({'status': 'available'})
                elif new_status == 'open':
                    # Vehicle goes back to shop
                    rec.vehicle_id.write({'status': 'in_shop'})

        return result

    def unlink(self):
        """Restore vehicle status when an open maintenance record is deleted."""
        for rec in self:
            if rec.status == 'open' and rec.vehicle_id:
                # Check if vehicle has any OTHER open maintenance records
                other_open = self.search([
                    ('vehicle_id', '=', rec.vehicle_id.id),
                    ('status', '=', 'open'),
                    ('id', '!=', rec.id),
                ], limit=1)
                if not other_open and rec.vehicle_id.status != 'retired':
                    rec.vehicle_id.write({'status': 'available'})
        return super().unlink()
