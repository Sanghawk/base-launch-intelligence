export type DbClientStatus = 'not_configured';

export type DbClientPlaceholder = {
  status: DbClientStatus;
};

export const dbClientPlaceholder: DbClientPlaceholder = {
  status: 'not_configured'
};
