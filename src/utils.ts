import { CLEAR_FIELD_VALUE } from "./constants";

export const isClearFieldValue = (value: unknown) => typeof value === "string" && value.trim() === CLEAR_FIELD_VALUE;
