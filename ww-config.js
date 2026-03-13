export default {
  editor: {
    label: { en: 'Admin: Feedback' },
    icon: 'message-square',
    categories: ['content'],
  },
  triggerEvents: [
    {
      name: 'feedback:reviewPublished',
      label: { en: 'On Review Published' },
      event: { reviewId: '' },
    },
    {
      name: 'feedback:reviewAccepted',
      label: { en: 'On Review Accepted' },
      event: { reviewId: '' },
    },
    {
      name: 'feedback:featureCreated',
      label: { en: 'On Feature Created' },
      event: { title: '' },
    },
    {
      name: 'feedback:featureDeactivated',
      label: { en: 'On Feature Deactivated' },
      event: { featureId: '' },
    },
    {
      name: 'feedback:toggleChanged',
      label: { en: 'On Feature Upvote System Toggled' },
      event: { enabled: true },
    },
    {
      name: 'feedback:categoryUpdated',
      label: { en: 'On Category Changed' },
      event: { action: 'create', id: '' },
    },
    {
      name: 'feedback:error',
      label: { en: 'On Error' },
      event: { message: '' },
    },
  ],
  properties: {
    supabaseUrl: {
      label: { en: 'Supabase URL' },
      type: 'Text',
      bindable: true,
      hidden: true,
      defaultValue: '',
    },
    supabaseAnonKey: {
      label: { en: 'Supabase Anon Key' },
      type: 'Text',
      bindable: true,
      hidden: true,
      defaultValue: '',
    },
    accessToken: {
      label: { en: 'Auth Token' },
      type: 'Text',
      bindable: true,
      hidden: true,
      defaultValue: '',
    },
    refreshTrigger: {
      label: { en: 'Refresh Trigger' },
      type: 'Number',
      bindable: true,
      defaultValue: 0,
    },
    defaultSection: {
      label: { en: 'Default Section' },
      type: 'TextSelect',
      options: {
        options: [
          { value: 'reviews',    label: { en: 'Reviews Inbox' } },
          { value: 'features',   label: { en: 'Feature Rollout' } },
          { value: 'categories', label: { en: 'Review Categories' } },
        ],
      },
      defaultValue: 'reviews',
    },
    portalTarget: {
      label: { en: 'Portal Target' },
      type: 'Text',
      bindable: true,
      hidden: true,
      defaultValue: '',
    },
    userRole: {
      label: { en: 'User Role' },
      type: 'Text',
      bindable: true,
      hidden: true,
      defaultValue: '',
    },
  },
};
