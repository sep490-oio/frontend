# 03 -- Item Questions & Answers

> **Status**: Not Implemented
> **BE docs**: `backend/docs/flows/05-item-management/03-item-qa.md`

## Overview

The BE supports a Q&A system where buyers can ask questions about items and sellers can answer them. Questions are public by default and attached to the item aggregate. This feature is **not yet implemented** on the frontend.

---

## BE Endpoints (Not Consumed)

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/items/{itemId}/questions` | Ask a question on an item |
| `POST` | `/api/items/{itemId}/questions/{questionId}/answer` | Seller answers a question |
| `GET` | `/api/items/{itemId}/questions` | Get paginated public questions for an item |

---

## BE Feature Summary

### Ask a Question
- **Auth**: `items.ask_question` permission
- **Constraint**: Cannot ask on own item (`askerId != sellerId`)
- **Constraint**: Item must not be in `Draft` or `Removed` status
- **Constraint**: Max 100 questions per item (configurable via `Item.MaxQuestionsPerItem`)
- **Validation**: Question text max 1000 characters
- **Result**: Creates `ItemQuestion` entity with `isPublic = true`
- **Event**: Raises `ItemQuestionAskedEvent` (can trigger seller notification)

### Answer a Question
- **Auth**: Must be the item's seller
- **Constraint**: Question must not already be answered
- **Validation**: Answer text max 2000 characters
- **Event**: Raises `ItemQuestionAnsweredEvent` (can trigger asker notification)

### List Questions
- **Auth**: Authenticated
- **Returns**: Paginated list of public questions (`isPublic == true`), sorted by `createdAt` descending
- **Response type**: `PagedList<ItemQuestionDto>`

---

## FE Type (Exists but Unused)

The `ItemQuestion` interface is already defined in `src/types/item.ts`:

```typescript
export interface ItemQuestion {
  id: string;
  itemId: string;
  askerId: string;
  askerName: string | null;
  question: string;
  answer: string | null;
  answeredAt: string | null;
  isPublic: boolean;
  createdAt: string;
}
```

---

## Implementation Notes

To implement Q&A on the frontend, the following would be needed:

1. **Item detail page** (or section within auction detail): Display list of questions with answers
2. **Ask question form**: Text input for buyers, visible when viewing another seller's item
3. **Answer question UI**: For sellers, shown on their own item's question list
4. **Service functions**: `askQuestion()`, `answerQuestion()`, `getItemQuestions()` in `auctionService.ts`
5. **TanStack Query hooks**: `useItemQuestions()` query, `useAskQuestion()` / `useAnswerQuestion()` mutations

---

## Source Files

| File | What it does |
|------|-------------|
| `src/types/item.ts` | `ItemQuestion` interface (defined, not yet consumed) |
