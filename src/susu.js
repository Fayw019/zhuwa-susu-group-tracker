export class SusuGroup {
  constructor({ name = "My Susu Group", weeklyContribution }) {
    if (typeof name !== "string" || !name.trim()) throw new Error("Group name is required.");
    this.name = name.trim();
    this.weeklyContribution = this.money(weeklyContribution, "Weekly contribution");
    if (this.weeklyContribution <= 0) throw new Error("Weekly contribution must be greater than zero.");
    this.members = [];
    this.currentWeek = 1;
    this.payments = new Map();
    this.payouts = [];
    this.nextMemberId = 1;
  }
  money(value, label = "Amount") {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) throw new Error(`${label} must be a valid non-negative amount.`);
    if (Math.round(n * 100) !== n * 100) throw new Error(`${label} cannot have more than two decimal places.`);
    return Math.round(n * 100) / 100;
  }
  addMember(name) {
    if (typeof name !== "string" || !name.trim()) throw new Error("Member name is required.");
    const clean = name.trim();
    if (this.members.some(m => m.name.toLowerCase() === clean.toLowerCase())) throw new Error("A member with that name already exists.");
    const member = { id: `M${this.nextMemberId++}`, name: clean, joinOrder: this.members.length + 1 };
    this.members.push(member);
    return { ...member };
  }
  getMember(id) {
    const member = this.members.find(m => m.id === id);
    if (!member) throw new Error("Member not found.");
    return member;
  }
  amountPaid(id, week = this.currentWeek) { this.getMember(id); return this.payments.get(`${week}:${id}`) ?? 0; }
  amountOwed(id, week = this.currentWeek) { return Math.round((this.weeklyContribution - this.amountPaid(id, week)) * 100) / 100; }
  recordContribution(id, amount) {
    this.getMember(id);
    const payment = this.money(amount, "Payment");
    if (payment <= 0) throw new Error("Payment must be greater than zero.");
    const paid = this.amountPaid(id), owed = this.amountOwed(id);
    if (payment > owed) throw new Error("Payment exceeds the member's outstanding balance.");
    const total = Math.round((paid + payment) * 100) / 100;
    this.payments.set(`${this.currentWeek}:${id}`, total);
    return { paid: total, owed: this.amountOwed(id) };
  }
  outstandingBalances() {
    return this.members.map(member => ({ member: { ...member }, paid: this.amountPaid(member.id), owed: this.amountOwed(member.id) }));
  }
  weekIsFullyPaid() { return this.members.length > 0 && this.members.every(m => this.amountOwed(m.id) === 0); }
  closeWeek() {
    if (!this.members.length) throw new Error("Add at least one member before closing a week.");
    if (this.payouts.length >= this.members.length) throw new Error("The savings cycle is complete; every member has received a payout.");
    if (!this.weekIsFullyPaid()) throw new Error("Cannot close the week until every member has paid in full.");
    const recipient = this.members[this.payouts.length];
    const amount = Math.round(this.weeklyContribution * this.members.length * 100) / 100;
    const payout = { week: this.currentWeek, memberId: recipient.id, memberName: recipient.name, amount };
    this.payouts.push(payout);
    this.currentWeek += 1;
    return { ...payout };
  }
  report() {
    return { groupName: this.name, weeklyContribution: this.weeklyContribution, currentWeek: this.currentWeek,
      memberCount: this.members.length, currentPot: Math.round(this.weeklyContribution * this.members.length * 100) / 100,
      balances: this.outstandingBalances(), payouts: this.payouts.map(p => ({ ...p })),
      cycleComplete: this.payouts.length >= this.members.length && this.members.length > 0 };
  }
}
