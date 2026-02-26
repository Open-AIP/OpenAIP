import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import type { CommentThreadAccordionItem } from "@/features/feedback/components/comment-thread-accordion-list";
import { CommentThreadAccordionList } from "@/features/feedback/components/comment-thread-accordion-list";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function countMatches(haystack: string, needle: string) {
  return haystack.split(needle).length - 1;
}

export async function runCommentThreadAccordionListTests() {
  const items: CommentThreadAccordionItem[] = [
    {
      threadId: "t1",
      href: "/barangay/aips/aip_001?tab=comments&thread=t1",
      card: {
        authorName: "Carlos Mendoza",
        authorScopeLabel: "Brgy. San Isidro",
        updatedAt: "2026-01-25T00:00:00.000Z",
        kind: "question",
        status: "no_response",
        contextTitle: "Annual Investment Program 2026",
        contextSubtitle: "SS-2026-012",
        snippet: "Hello",
      },
    },
    {
      threadId: "t2",
      href: "/barangay/aips/aip_001?tab=comments&thread=t2",
      card: {
        authorName: "Anton Reyes",
        authorScopeLabel: "Brgy. Poblacion",
        updatedAt: "2026-01-25T00:00:00.000Z",
        kind: "suggestion",
        status: "responded",
        contextTitle: "Annual Investment Program 2026",
        contextSubtitle: "SS-2026-013",
        snippet: "World",
      },
    },
  ];

  const htmlSelected = renderToStaticMarkup(
    <CommentThreadAccordionList
      items={items}
      selectedThreadId="t2"
      onNavigate={() => {}}
      onClearSelection={() => {}}
      renderExpandedContent={(threadId) => (
        <div data-testid="expanded">{threadId}</div>
      )}
    />
  );

  assert(
    countMatches(htmlSelected, 'data-testid="expanded"') === 1,
    "Expected exactly one expanded panel when selectedThreadId matches an item"
  );
  assert(
    htmlSelected.includes('data-thread-id="t2"') &&
      htmlSelected.includes('data-thread-expanded="true"'),
    "Expected selected thread to be marked expanded"
  );

  const htmlNone = renderToStaticMarkup(
    <CommentThreadAccordionList
      items={items}
      selectedThreadId={null}
      onNavigate={() => {}}
      onClearSelection={() => {}}
      renderExpandedContent={() => <div data-testid="expanded" />}
    />
  );
  assert(
    countMatches(htmlNone, 'data-testid="expanded"') === 0,
    "Expected no expanded panel when selectedThreadId is null"
  );

  const htmlInvalid = renderToStaticMarkup(
    <CommentThreadAccordionList
      items={items}
      selectedThreadId="does_not_exist"
      onNavigate={() => {}}
      onClearSelection={() => {}}
      renderExpandedContent={() => <div data-testid="expanded" />}
    />
  );
  assert(
    countMatches(htmlInvalid, 'data-testid="expanded"') === 0,
    "Expected no expanded panel when selectedThreadId is invalid"
  );
}

