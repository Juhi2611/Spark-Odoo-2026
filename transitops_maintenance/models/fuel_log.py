# -*- coding: utf-8 -*-
from odoo import models, fields, api


class FuelLog(models.Model):
    """Record fuel fill-ups for fleet vehicles."""

    _name = 'transitops.fuel.log'
    _description = 'Fuel Log'
    _order = 'date desc, id desc'

    # ── Relationships ───────────────────────────────────────
    vehicle_id = fields.Many2one(
        comodel_name='transitops.vehicle',
        string='Vehicle',
        required=True,
        ondelete='restrict',
        index=True,
    )

    # ── Fuel Details ────────────────────────────────────────
    date = fields.Date(
        string='Date',
        required=True,
        default=fields.Date.today,
        index=True,
    )

    liters = fields.Float(
        string='Liters',
        digits=(10, 2),
        required=True,
    )

    price_per_liter = fields.Float(
        string='Price / Liter (₹)',
        digits=(10, 2),
        required=True,
    )

    cost = fields.Float(
        string='Total Cost (₹)',
        digits=(12, 2),
        compute='_compute_cost',
        store=True,
        readonly=True,
    )

    odometer = fields.Float(
        string='Odometer (km)',
        digits=(10, 1),
        help='Odometer reading at the time of fill-up',
    )

    notes = fields.Text(
        string='Notes',
    )

    # ── Computed Fields ─────────────────────────────────────
    @api.depends('liters', 'price_per_liter')
    def _compute_cost(self):
        for rec in self:
            rec.cost = rec.liters * rec.price_per_liter
