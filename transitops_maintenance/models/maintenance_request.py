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
        """Assign auto-sequence on creation."""
        for vals in vals_list:
            if vals.get('name', 'New') == 'New':
                vals['name'] = self.env['ir.sequence'].next_by_code(
                    'transitops.maintenance.request'
                ) or 'New'
        return super().create(vals_list)

    def write(self, vals):
        """Auto-fill date_closed when status transitions to closed."""
        if vals.get('status') == 'closed' and not vals.get('date_closed'):
            vals['date_closed'] = fields.Date.today()
        return super().write(vals)
