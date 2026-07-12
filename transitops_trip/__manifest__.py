# -*- coding: utf-8 -*-
{
    'name': 'TransitOps Trip Management',
    'version': '17.0.1.0.0',
    'summary': 'Trip creation, lifecycle management, and core business rule validations',
    'description': """
        TransitOps Trip Module
        ======================
        Yashvi's module in the TransitOps fleet management suite.

        Features:
        - Trip creation with source, destination, vehicle, driver, cargo weight
        - Full trip lifecycle: Draft → Dispatched → Completed / Cancelled
        - Cargo weight validation against vehicle max load capacity
        - Overlap prevention: vehicle or driver already On Trip cannot be reassigned
        - Automatic status cascade on Dispatch, Complete, and Cancel
        - Auto-generated trip reference numbers (TRP-XXXX)
        - Demo data with 5 sample trips
    """,
    'category': 'Fleet',
    'author': 'Yashvi (TransitOps Team)',
    'website': '',
    'license': 'LGPL-3',
    'depends': [
        'base',
        'transitops_core',   # Juhi's module — provides transitops.vehicle & transitops.driver
    ],
    'data': [
        'security/ir.model.access.csv',
        'data/sequence.xml',
        'views/trip_views.xml',
        'views/menu.xml',
    ],
    'demo': [
        'data/demo_data.xml',
    ],
    'installable': True,
    'application': True,
    'auto_install': False,
}
