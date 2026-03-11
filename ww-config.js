export default {
  editor: {
    label: { en: 'Admin: Feedback' },
    icon: 'message-square',
    categories: ['content'],
  },
  triggerEvents: [
    {
      name: 'feedback:reviewActioned',
      label: { en: 'On Review Actioned' },
      event: { reviewId: '', action: 'accept' },
    },
    {
      name: 'feedback:featureCreated',
      label: { en: 'On Feature Created' },
      event: { title: '' },
    },
    {
      name: 'feedback:featureToggled',
      label: { en: 'On Feature Upvote System Toggled' },
      event: { enabled: true },
    },
    {
      name: 'feedback:categoryChanged',
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
  },
};
