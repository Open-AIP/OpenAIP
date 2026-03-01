-- Seed/update citizen about-us backend content.
-- Requires app.settings table from:
-- website/docs/sql/2026-02-26_app_settings_schema_and_grants.sql

insert into app.settings (key, value)
values (
  'content.citizen_about_us',
  '{
    "referenceDocs": [
      {
        "id": "dbm_primer_cover",
        "title": "DBM Primer Cover (Volume 1)",
        "source": "Source: DBM",
        "kind": "storage",
        "bucketId": "about-us-docs",
        "objectName": "reference/dbm-primer-cover-volume-1.pdf"
      },
      {
        "id": "dbm_primer_cover_volume_2",
        "title": "DBM Primer Cover (Volume 2)",
        "source": "Source: DBM",
        "kind": "storage",
        "bucketId": "about-us-docs",
        "objectName": "reference/dbm-primer-cover-volume-2.pdf"
      },
      {
        "id": "ra_7160",
        "title": "RA 7160",
        "source": "Source: Official Code",
        "kind": "storage",
        "bucketId": "about-us-docs",
        "objectName": "reference/ra-7160.pdf"
      },
      {
        "id": "lbm_92_fy_2026",
        "title": "LBM No. 92, FY 2026",
        "source": "Source: DBM",
        "kind": "storage",
        "bucketId": "about-us-docs",
        "objectName": "reference/lbm-no-92-fy-2026.pdf"
      }
    ],
    "quickLinks": [
      { "id": "dashboard", "href": "/" },
      { "id": "budget_allocation", "href": "/budget-allocation" },
      { "id": "aips", "href": "/aips" },
      { "id": "projects", "href": "/projects" }
    ]
  }'
)
on conflict (key)
do update set value = excluded.value;
