# -*- coding: utf-8 -*-
{
    'name': 'TransitOps Auth',
    'version': '17.0.1.0.0',
    'summary': 'Access Control and Security Groups for TransitOps',
    'description': """
        TransitOps Auth Module
        ======================
        Defines security groups: Fleet Manager, Fleet Operator, Viewer.
    """,
    'category': 'Fleet',
    'author': 'Juhi (TransitOps Team)',
    'website': '',
    'license': 'LGPL-3',
    'depends': [
        'base',
        'transitops_core',
    ],
    'data': [
        'security/security_groups.xml',
    ],
    'installable': True,
    'application': False,
    'auto_install': False,
}
