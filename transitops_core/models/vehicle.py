# -*- coding: utf-8 -*-
from odoo import models, fields

class Vehicle(models.Model):
    _name = 'transitops.vehicle'
    _description = 'TransitOps Vehicle'
    
    name = fields.Char(string='Vehicle Name', required=True)
    vehicle_type = fields.Selection([
        ('bus', 'Bus'),
        ('van', 'Van'),
        ('truck', 'Truck'),
        ('sedan', 'Sedan'),
    ], string='Vehicle Type')
    
    license_plate = fields.Char(string='License Plate')
    
    status = fields.Selection([
        # Juhi's statuses
        ('active', 'Active'),
        ('idle', 'Idle'),
        ('in_maintenance', 'In Maintenance'),
        # Yashvi's required statuses
        ('available', 'Available'),
        ('on_trip', 'On Trip'),
        ('in_shop', 'In Shop'),
        ('retired', 'Retired'),
    ], string='Status', default='active')
    
    region = fields.Selection([
        ('north', 'North'),
        ('south', 'South'),
        ('east', 'East'),
        ('west', 'West'),
    ], string='Region')

    capacity = fields.Integer(string='Passenger Capacity')
    model_year = fields.Char(string='Model Year')

    # Expected by Yashvi's transitops_trip code
    max_load_capacity = fields.Float(string='Max Load Capacity (kg)')

    _sql_constraints = [
        ('license_plate_uniq', 'unique (license_plate)', 'The license plate must be unique!')
    ]
