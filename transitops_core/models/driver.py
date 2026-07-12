# -*- coding: utf-8 -*-
from odoo import models, fields

class Driver(models.Model):
    _name = 'transitops.driver'
    _description = 'TransitOps Driver'
    
    name = fields.Char(string='Driver Name', required=True)
    license_number = fields.Char(string='License Number')
    phone = fields.Char(string='Phone')
    
    status = fields.Selection([
        # Juhi's statuses
        ('on_duty', 'On Duty'),
        ('off_duty', 'Off Duty'),
        ('on_leave', 'On Leave'),
        # Yashvi's required statuses
        ('available', 'Available'),
        ('on_trip', 'On Trip'),
        ('suspended', 'Suspended'),
    ], string='Status', default='on_duty')
    
    vehicle_id = fields.Many2one('transitops.vehicle', string='Current Assignment')

    # Expected by Yashvi's transitops_trip code
    license_expiry_date = fields.Date(string='License Expiry Date')
