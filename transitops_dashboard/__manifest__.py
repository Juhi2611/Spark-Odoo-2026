# -*- coding: utf-8 -*-
{
    'name': 'TransitOps Dashboard',
    'version': '17.0.1.0.0',
    'summary': 'KPI Dashboard for TransitOps',
    'description': """
        TransitOps Dashboard Module
        ===========================
        Computes the KPIs reading from Core, Trip, and Maintenance modules.
    """,
    'category': 'Fleet',
    'author': 'Juhi (TransitOps Team)',
    'website': '',
    'license': 'LGPL-3',
    'depends': [
        'base',
        'transitops_core',
        'transitops_trip',
        'transitops_maintenance',
    ],
    'data': [
        'security/ir.model.access.csv',
        'data/dashboard_data.xml',
        'views/dashboard_views.xml',
    ],
    'installable': True,
    'application': False,
    'auto_install': False,
}
