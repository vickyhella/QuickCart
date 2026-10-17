import type { CollectionConfig } from 'payload'

export const Suppliers: CollectionConfig = {
  slug: 'suppliers',
  admin: {
    group: 'Supplier',
    useAsTitle: 'name',
    defaultColumns: ['name', 'purchaseURL', 'updatedAt', 'actions'],
    description: 'Supplier records used by products and variants.',
    components: {
      views: {
        manageProducts: {
          Component: '/components/SupplierProductsView#SupplierProductsView',
          path: '/:id/manage-products',
          exact: true,
        },
      },
    },
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    { name: 'name', type: 'text', label: 'Supplier', required: true, unique: true, admin: { components: { Cell: '/components/SupplierActionCell#SupplierNameCell' } } },
    { name: 'purchaseURL', type: 'text', label: 'Supplier Purchase URL', admin: { description: 'Supplier storefront or supplier homepage URL. This is separate from product purchasing links.', components: { Field: '/components/PurchaseURLField#PurchaseURLField', Cell: '/components/PurchaseURLField#PurchaseURLCell' } } },
    { name: 'actions', type: 'ui', label: 'Action', admin: { disableListColumn: false, width: '240px', components: { Cell: '/components/SupplierActionCell#SupplierActionCell' } } },
  ],
}
