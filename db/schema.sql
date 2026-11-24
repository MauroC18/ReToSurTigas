
create table if not exists configuracion (
  id   int primary key default 1 check (id = 1),
  meta int not null check (meta between 1 and 60)
);

create table if not exists oficinas (
  id       text primary key,
  nombre   text not null,
  s        float8 not null check (s > 0),
  hay      int not null check (hay >= 0),
  llegadas float8[] not null,
  orden    int not null
);

create table if not exists ausencias (
  id          text primary key,
  colaborador text not null,
  oficina_id  text not null references oficinas (id),
  tipo        text not null,
  desde       date not null,
  hasta       date not null
);

create table if not exists sugerencias (
  id         text primary key,
  origen_id  text not null references oficinas (id),
  destino_id text not null references oficinas (id),
  personas   int not null check (personas > 0),
  modalidad  text not null check (modalidad in ('presencial', 'virtual')),
  franjas    text[] not null,
  estado     text not null check (estado in ('pendiente', 'aprobada', 'rechazada'))
);

alter table configuracion enable row level security;
alter table oficinas      enable row level security;
alter table ausencias     enable row level security;
alter table sugerencias   enable row level security;