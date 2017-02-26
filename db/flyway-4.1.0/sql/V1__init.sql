CREATE TABLE player(
  id bigint primary key,
  name text not null
);

CREATE TABLE mmr_log(
  player_id bigint references player(id),
  mmr integer not null,
  timestamp timestamptz default (now() at time zone 'utc')
);

CREATE INDEX mmr_log_ts_idx ON mmr_log(timestamp);
