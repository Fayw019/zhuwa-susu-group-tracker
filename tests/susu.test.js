import test from "node:test";
import assert from "node:assert/strict";
import { SusuGroup } from "../src/susu.js";

function setup() {
  const group = new SusuGroup({ name: "Test Susu", weeklyContribution: 50 });
  return { group, ama: group.addMember("Ama"), kofi: group.addMember("Kofi"), esi: group.addMember("Esi") };
}
test("creates group and calculates pot", () => { const {group} = setup(); assert.equal(group.report().currentPot, 150); });
test("rejects zero weekly contribution", () => assert.throws(() => new SusuGroup({weeklyContribution: 0}), /greater than zero/));
test("records join order", () => { const {ama,kofi} = setup(); assert.equal(ama.joinOrder, 1); assert.equal(kofi.joinOrder, 2); });
test("rejects duplicate names regardless of case", () => { const {group} = setup(); assert.throws(() => group.addMember("ama"), /already exists/); });
test("records partial payment and balance", () => { const {group,esi} = setup(); assert.deepEqual(group.recordContribution(esi.id, 30), {paid:30, owed:20}); });
test("rejects unknown member", () => { const {group} = setup(); assert.throws(() => group.recordContribution("bad-id", 10), /Member not found/); });
test("rejects zero, negative and over-balance payments", () => { const {group,ama} = setup(); assert.throws(() => group.recordContribution(ama.id,0), /greater than zero/); assert.throws(() => group.recordContribution(ama.id,-1), /non-negative/); assert.throws(() => group.recordContribution(ama.id,51), /exceeds/); });
test("rejects more than two decimal places", () => { const {group,ama} = setup(); assert.throws(() => group.recordContribution(ama.id,1.234), /two decimal places/); });
test("does not close week while member owes", () => { const {group,ama,kofi} = setup(); group.recordContribution(ama.id,50); group.recordContribution(kofi.id,50); assert.throws(() => group.closeWeek(), /every member has paid in full/); });
test("pays first member once all pay", () => { const {group,ama,kofi,esi} = setup(); [ama,kofi,esi].forEach(m => group.recordContribution(m.id,50)); const p=group.closeWeek(); assert.equal(p.memberId,ama.id); assert.equal(p.amount,150); assert.equal(group.currentWeek,2); });
test("supports multiple partial payments", () => { const {group,esi} = setup(); group.recordContribution(esi.id,20); assert.deepEqual(group.recordContribution(esi.id,30),{paid:50,owed:0}); });
test("pays members in order and ends cycle", () => { const {group,ama,kofi,esi} = setup(); const recipients=[]; for(let i=0;i<3;i++){[ama,kofi,esi].forEach(m=>group.recordContribution(m.id,50)); recipients.push(group.closeWeek().memberId);} assert.deepEqual(recipients,[ama.id,kofi.id,esi.id]); assert.equal(group.report().cycleComplete,true); assert.throws(()=>group.closeWeek(),/cycle is complete/); });
test("report tracks payout history and new week balances", () => { const {group,ama,kofi,esi} = setup(); [ama,kofi,esi].forEach(m=>group.recordContribution(m.id,50)); group.closeWeek(); const r=group.report(); assert.equal(r.payouts[0].memberName,"Ama"); assert.equal(r.currentWeek,2); assert.ok(r.balances.every(b=>b.owed===50)); });
