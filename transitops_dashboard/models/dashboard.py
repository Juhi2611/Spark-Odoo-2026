# -*- coding: utf-8 -*-
from odoo import models, fields, api

class DashboardKPI(models.Model):
    _name = 'transitops.dashboard.kpi'
    _description = 'TransitOps Dashboard KPIs'
    
    name = fields.Char(default="Dashboard", readonly=True)
    
    active_vehicles = fields.Integer(compute='_compute_kpis')
    available_vehicles = fields.Integer(compute='_compute_kpis')
    vehicles_in_maintenance = fields.Integer(compute='_compute_kpis')
    
    active_trips = fields.Integer(compute='_compute_kpis')
    pending_trips = fields.Integer(compute='_compute_kpis')
    
    drivers_on_duty = fields.Integer(compute='_compute_kpis')
    
    fleet_utilization = fields.Float(compute='_compute_kpis', string='Fleet Utilization (%)')

    def _compute_kpis(self):
        for rec in self:
            Vehicle = self.env['transitops.vehicle']
            Trip = self.env['transitops.trip']
            Driver = self.env['transitops.driver']
            
            # Vehicles
            total_vehicles = Vehicle.search_count([])
            rec.active_vehicles = Vehicle.search_count([('status', 'in', ['active', 'available', 'on_trip'])])
            rec.available_vehicles = Vehicle.search_count([('status', 'in', ['available', 'idle'])])
            rec.vehicles_in_maintenance = Vehicle.search_count([('status', 'in', ['in_maintenance', 'in_shop'])])
            
            # Trips
            rec.active_trips = Trip.search_count([('status', '=', 'dispatched')])
            rec.pending_trips = Trip.search_count([('status', '=', 'draft')])
            
            # Drivers
            rec.drivers_on_duty = Driver.search_count([('status', 'in', ['on_duty', 'on_trip'])])
            
            # Utilization
            if total_vehicles > 0:
                rec.fleet_utilization = (rec.active_trips / total_vehicles) * 100.0
            else:
                rec.fleet_utilization = 0.0
