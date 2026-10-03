import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import {
  parseTeamSeed,
  relationshipTo,
  validatePeople,
  visiblePeople,
  type TeamPerson,
} from "../lib/team/model";

const teamId = randomUUID();
const ids = Array.from({ length: 11 }, () => randomUUID());
const parents = [null, 0, 1, 1, 1, 1, 0, 0, 0, 8, 6];
const people: TeamPerson[] = parents.map((parent, index) => ({
  id: ids[index],
  team_id: teamId,
  display_name: index === 7 ? "Person 0" : `Person ${index}`,
  sponsor_person_id: parent === null ? null : ids[parent],
  context: "Internal description",
}));

test("the supplied tree shape has eleven distinct people and ten sponsor links", () => {
  const seed = parseTeamSeed({
    team: {
      id: teamId,
      slug: "test-team",
      name: "Test team",
      focus_person_id: ids[2],
    },
    people,
  });
  assert.equal(seed.people.length, 11);
  assert.equal(
    seed.people.filter((person) => person.sponsor_person_id).length,
    10,
  );
  assert.equal(
    seed.people.filter((person) => person.display_name === "Person 0").length,
    2,
  );
});
test("relationships are relative to the selected person and include indirect branches", () => {
  assert.equal(relationshipTo(people, ids[2], ids[2]), "self");
  assert.equal(relationshipTo(people, ids[2], ids[1]), "direct upline");
  assert.equal(relationshipTo(people, ids[2], ids[0]), "upline");
  for (const index of [3, 4, 5])
    assert.equal(relationshipTo(people, ids[2], ids[index]), "direct sideline");
  for (const index of [6, 7, 8, 9, 10])
    assert.equal(relationshipTo(people, ids[2], ids[index]), "sideline");
  assert.equal(relationshipTo(people, ids[0], ids[1]), "direct downline");
  assert.equal(relationshipTo(people, ids[0], ids[2]), "downline");
});
test("an unlinked or regular member never gets other branches serialized", () => {
  assert.deepEqual(visiblePeople(people, randomUUID(), "member"), []);
  const memberView = visiblePeople(people, ids[1], "member");
  assert.deepEqual(
    new Set(memberView.map((person) => person.id)),
    new Set([0, 1, 2, 3, 4, 5].map((index) => ids[index])),
  );
  assert.ok(memberView.every((person) => person.context === null));
  const leafView = visiblePeople(people, ids[2], "member");
  assert.deepEqual(
    new Set(leafView.map((person) => person.id)),
    new Set([ids[1], ids[2]]),
  );
  assert.equal(
    leafView.find((person) => person.id === ids[1])?.sponsor_person_id,
    null,
  );
});
test("managers see their team but not a separate team's people", () => {
  const outsider = { ...people[0], id: randomUUID(), team_id: randomUUID() };
  assert.equal(
    visiblePeople([...people, outsider], ids[2], "manager").length,
    11,
  );
  assert.equal(
    relationshipTo([...people, outsider], ids[2], outsider.id),
    "unrelated",
  );
});
test("invalid identities, missing sponsors, cross-team links and cycles are rejected", () => {
  assert.throws(() => validatePeople([...people, people[0]]), /Duplicate/);
  assert.throws(
    () => validatePeople([{ ...people[0], sponsor_person_id: randomUUID() }]),
    /Unknown/,
  );
  assert.throws(
    () =>
      validatePeople([
        { ...people[0], sponsor_person_id: ids[2] },
        ...people.slice(1),
      ]),
    /cycle/,
  );
  assert.throws(
    () => validatePeople([{ ...people[0], sponsor_person_id: ids[0] }]),
    /cycle/,
  );
  assert.throws(
    () => validatePeople([people[0], { ...people[1], team_id: randomUUID() }]),
    /Cross-team/,
  );
});
