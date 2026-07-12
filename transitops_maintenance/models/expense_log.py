# -*- coding: utf-8 -*-
from odoo import models, fields


class ExpenseLog(models.Model):
    """Track operational expenses for fleet vehicles."""

    _name = 'transitops.expense.log'
    _description = 'Expense Log'
    _order = 'date desc, id desc'

    # ── Relationships ───────────────────────────────────────
    vehicle_id = fields.Many2one(
        comodel_name='transitops.vehicle',
        string='Vehicle',
        required=True,
        ondelete='restrict',
        index=True,
    )

    # ── Expense Details ─────────────────────────────────────
    date = fields.Date(
        string='Date',
        required=True,
        default=fields.Date.today,
        index=True,
    )

    expense_type = fields.Selection(
        selection=[
            ('toll', 'Toll Charges'),
            ('parking', 'Parking Fees'),
            ('driver_allowance', 'Driver Allowance'),
            ('insurance', 'Insurance'),
            ('other', 'Other'),
        ],
        string='Expense Type',
        required=True,
        default='other',
    )

    cost = fields.Float(
        string='Cost (₹)',
        digits=(12, 2),
        required=True,
    )

    description = fields.Text(
        string='Description',
        help='Additional details about the expense',
    )
