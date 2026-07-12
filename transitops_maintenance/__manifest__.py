# -*- coding: utf-8 -*-
{
    'name': 'TransitOps Maintenance',
    'version': '17.0.1.0.0',
    'summary': 'Maintenance requests, fuel logs, and expense tracking for TransitOps fleet',
    'description': """
        TransitOps Maintenance Module
        =============================
        Snehi's module in the TransitOps fleet management suite.

        Features:
        - Maintenance request tracking (open/closed workflow)
        - Fuel log recording with computed costs
        - Operational expense logging by category
        - Demo data for immediate testing
    """,
    'category': 'Fleet',
    'author': 'Snehi (TransitOps Team)',
    'website': '',
    'license': 'LGPL-3',
    'depends': [
        'base',
        'transitops_core',  # Juhi's module — provides transitops.vehicle
    ],
    'data': [
        'security/ir.model.access.csv',
        'views/maintenance_request_views.xml',
        'views/fuel_log_views.xml',
        'views/expense_log_views.xml',
        'views/menu.xml',
    ],
    'demo': [
        'data/demo_data.xml',
    ],
    'installable': True,
    'application': True,
    'auto_install': False,
}
