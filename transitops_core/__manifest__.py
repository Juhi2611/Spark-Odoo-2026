# -*- coding: utf-8 -*-
{
    'name': 'TransitOps Core',
    'version': '17.0.1.0.0',
    'summary': 'Core fleet management models (Vehicle, Driver)',
    'description': """
        TransitOps Core Module
        ======================
        Core definitions for Vehicles and Drivers.
    """,
    'category': 'Fleet',
    'author': 'Juhi (TransitOps Team)',
    'website': '',
    'license': 'LGPL-3',
    'depends': [
        'base',
    ],
    'data': [
        'security/ir.model.access.csv',
        'views/vehicle_views.xml',
        'views/driver_views.xml',
    ],
    'demo': [
        'data/demo_data.xml',
    ],
    'installable': True,
    'application': True,
    'auto_install': False,
}
