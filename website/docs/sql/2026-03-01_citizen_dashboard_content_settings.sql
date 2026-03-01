-- Seed/update citizen dashboard backend content.
-- Requires app.settings table from:
-- website/docs/sql/2026-02-26_app_settings_schema_and_grants.sql

insert into app.settings (key, value)
values (
  'content.citizen_dashboard',
  '{
    "defaultCityPsgc": "043404",
    "defaultZoom": 13,
    "cityPin": {
      "scopeType": "city",
      "scopePsgc": "043404",
      "label": "City of Cabuyao",
      "lat": 14.272577955015906,
      "lng": 121.12205388675164,
      "kind": "main"
    },
    "barangayPins": [
      {
        "scopeType": "barangay",
        "scopePsgc": "043404002",
        "label": "Brgy. Banay-banay",
        "lat": 14.255193089069097,
        "lng": 121.12779746799986,
        "kind": "secondary"
      },
      {
        "scopeType": "barangay",
        "scopePsgc": "043404013",
        "label": "Brgy. Pulo",
        "lat": 14.249207085376085,
        "lng": 121.1320126110115,
        "kind": "secondary"
      },
      {
        "scopeType": "barangay",
        "scopePsgc": "043404015",
        "label": "Brgy. San Isidro",
        "lat": 14.242162608340106,
        "lng": 121.14395166755374,
        "kind": "secondary"
      },
      {
        "scopeType": "barangay",
        "scopePsgc": "043404009",
        "label": "Brgy. Mamatid",
        "lat": 14.237320473882946,
        "lng": 121.15088301850722,
        "kind": "secondary"
      }
    ],
    "hero": {
      "title": "Know Where Every Peso Goes.",
      "subtitle": "Explore the Annual Investment Plan through clear budget breakdowns, sector allocations, and funded projects - presented with transparency and accountability.",
      "ctaLabel": "Explore the AIP",
      "ctaHref": "/aips"
    },
    "manifesto": {
      "eyebrow": "Public. Clear. Accountable.",
      "lines": ["Every allocation.", "Every project.", "Every peso."],
      "subtext": "Because public funds deserve public clarity."
    },
    "feedback": {
      "title": "Your Voice Matters.",
      "subtitle": "Track feedback trends and response performance to ensure continued accountability."
    },
    "chatPreview": {
      "pillLabel": "AI Assistant",
      "title": "Ask Questions, Get Answers",
      "subtitle": "Don''t understand something? Just ask. Our AI chatbot can answer questions about budgets, projects, and programs. It''s like having a budget expert available 24/7.",
      "assistantName": "Budget Assistant",
      "assistantStatus": "Always ready to help",
      "userPrompt": "How much budget went to road projects?",
      "assistantIntro": "Road projects received PHP 12M in total. This covers:",
      "assistantBullets": [
        "12 ongoing projects",
        "8 completed projects",
        "Includes repairs and new construction"
      ],
      "suggestedPrompts": [
        "Where did health funds go?",
        "Show completed projects",
        "Which sector got most budget?"
      ],
      "ctaLabel": "Open Chatbot",
      "ctaHref": "/chatbot"
    },
    "finalCta": {
      "title": "Governance Made Visible.",
      "subtitle": "Stay informed. Stay engaged. Stay empowered.",
      "ctaLabel": "View Full AIP",
      "ctaHref": "/aips"
    }
  }'
)
on conflict (key)
do update set value = excluded.value;
