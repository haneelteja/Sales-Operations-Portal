alter table customers
  add column if not exists is_deprecated boolean not null default false;

comment on column customers.is_deprecated is
  'Marks a client as deprecated — hidden from entry forms and analysis tables, but history remains visible for records.';
