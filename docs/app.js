
import { SusuGroup } from "./susu.js";

const STORAGE_KEY = "zhuwa-susu-group-tracker-v1";

const $ = id => document.getElementById(id);

let toastTimer;

const money = amount =>
  new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS"
  }).format(amount);

function safe(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function notify(message, error = false) {
  const toast = $("toast");
  toast.textContent = message;
  toast.style.background = error ? "#8e352e" : "#193d2d";
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

function createDefaultGroup() {
  return new SusuGroup({
    name: "Community Susu",
    weeklyContribution: 50
  });
}

// Restore the saved group when the website opens.
function loadGroup() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return createDefaultGroup();
    }

    const data = JSON.parse(saved);

    if (
      !data ||
      !Array.isArray(data.members) ||
      !Array.isArray(data.payments) ||
      !Array.isArray(data.payouts)
    ) {
      return createDefaultGroup();
    }

    const restored = new SusuGroup({
      name: data.name,
      weeklyContribution: data.weeklyContribution
    });

    restored.members = data.members;
    restored.currentWeek = Number(data.currentWeek) || 1;
    restored.payments = new Map(data.payments);
    restored.payouts = data.payouts;
    restored.nextMemberId =
      Number(data.nextMemberId) ||
      restored.members.length + 1;

    return restored;
  } catch (error) {
    console.error("Could not restore saved group:", error);
    return createDefaultGroup();
  }
}

let group = loadGroup();

// Save members, payments, settings, and payout history.
function saveGroup() {
  try {
    const data = {
      name: group.name,
      weeklyContribution: group.weeklyContribution,
      members: group.members,
      currentWeek: group.currentWeek,
      payments: [...group.payments.entries()],
      payouts: group.payouts,
      nextMemberId: group.nextMemberId
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error("Could not save group:", error);
    return false;
  }
}

function render() {
  const report = group.report();

  // Show the saved settings in the form.
  $("group-name").value = group.name;
  $("weekly-amount").value = group.weeklyContribution.toFixed(2);

  $("stat-pot").textContent = money(report.currentPot);
  $("stat-members").textContent = report.memberCount;
  $("stat-week").textContent = report.currentWeek;
  $("stat-payouts").textContent = report.payouts.length;

  $("member-count").textContent =
    `${report.memberCount} member${report.memberCount === 1 ? "" : "s"}`;

  $("payout-count").textContent =
    `${report.payouts.length} payout${report.payouts.length === 1 ? "" : "s"}`;

  $("week-tag").textContent = `Week ${report.currentWeek}`;

  // Display the members.
  $("members-list").className =
    "list" + (report.memberCount ? "" : " empty");

  $("members-list").innerHTML = report.memberCount
    ? report.balances.map(({ member, paid }) => `
        <div class="member">
          <div class="avatar">${
            safe(
              member.name
                .split(/\s+/)
                .map(part => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()
            )
          }</div>
          <div class="member-info">
            <strong>${safe(member.name)}</strong>
            <small>${safe(member.id)} · ${money(paid)} paid this week</small>
          </div>
          <span class="hint">#${member.joinOrder}</span>
        </div>
      `).join("")
    : "Add your first member to get started.";

  // Refresh the payment member dropdown.
  const select = $("payment-member");
  const previousSelection = select.value;

  select.innerHTML = report.memberCount
    ? report.balances.map(({ member }) =>
        `<option value="${safe(member.id)}">${safe(member.name)}</option>`
      ).join("")
    : '<option value="">Add members first</option>';

  if (report.balances.some(item => item.member.id === previousSelection)) {
    select.value = previousSelection;
  }

  select.disabled = !report.memberCount || report.cycleComplete;
  $("payment-amount").disabled = !report.memberCount || report.cycleComplete;
  $("close-week").disabled = report.cycleComplete;

  $("close-week").textContent = report.cycleComplete
    ? "Savings cycle complete"
    : "Close week & pay out";

  // Display payment balances.
  $("balances-body").innerHTML = report.memberCount
    ? report.balances.map(({ member, paid, owed }) => {
        const percentage = Math.min(
          100,
          Math.round(paid / report.weeklyContribution * 100)
        );

        return `
          <tr>
            <td>
              <div class="person">
                <span class="mini">${safe(member.name[0].toUpperCase())}</span>
                ${safe(member.name)}
              </div>
            </td>
            <td>${money(paid)}</td>
            <td class="${owed ? "owed" : ""}">${money(owed)}</td>
            <td>
              <div class="track" aria-label="${percentage}% paid">
                <span style="width:${percentage}%"></span>
              </div>
            </td>
            <td>
              <span class="status ${owed ? "due" : "paid"}">
                ${owed ? "Payment due" : "Paid in full"}
              </span>
            </td>
          </tr>
        `;
      }).join("")
    : '<tr><td colspan="5" class="empty">Your balances will appear here.</td></tr>';

  // Display payout history.
  $("payout-history").className =
    "list" + (report.payouts.length ? "" : " empty");

  $("payout-history").innerHTML = report.payouts.length
    ? [...report.payouts].reverse().map(payout => `
        <div class="history">
          <div class="history-icon">↗</div>
          <div class="history-info">
            <strong>${safe(payout.memberName)} received the pot</strong>
            <small>Week ${payout.week} · ${safe(payout.memberId)}</small>
          </div>
          <div class="amount">${money(payout.amount)}</div>
        </div>
      `).join("")
    : "Payouts will appear here after a week is closed.";
}

// Update group settings.
$("group-form").addEventListener("submit", event => {
  event.preventDefault();

  try {
    const name = $("group-name").value.trim();
    const amount = Number($("weekly-amount").value);

    if (!name) {
      throw Error("Group name is required.");
    }

    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      Math.round(amount * 100) !== amount * 100
    ) {
      throw Error("Enter a positive amount with up to two decimal places.");
    }

    if (
      group.payouts.length ||
      group.members.some(member => group.amountPaid(member.id) > 0)
    ) {
      throw Error("Settings cannot change after payments begin.");
    }

    const names = group.members.map(member => member.name);

    group = new SusuGroup({
      name,
      weeklyContribution: amount
    });

    names.forEach(memberName => group.addMember(memberName));

    const saved = saveGroup();
    render();

    notify(
      saved ? "Group settings updated and saved." : "Settings changed, but saving failed.",
      !saved
    );
  } catch (error) {
    notify(error.message, true);
  }
});

// Add a new member.
$("member-form").addEventListener("submit", event => {
  event.preventDefault();

  try {
    if (group.payouts.length) {
      throw Error("You cannot add members after the first payout.");
    }

    group.addMember($("member-name").value);
    $("member-name").value = "";

    const saved = saveGroup();
    render();

    notify(
      saved ? "Member added and saved." : "Member added, but saving failed.",
      !saved
    );
  } catch (error) {
    notify(error.message, true);
  }
});

// Record a contribution.
$("payment-form").addEventListener("submit", event => {
  event.preventDefault();

  try {
    const result = group.recordContribution(
      $("payment-member").value,
      Number($("payment-amount").value)
    );

    $("payment-amount").value = "";

    const saved = saveGroup();
    render();

    notify(
      saved
        ? `Payment saved. Remaining: ${money(result.owed)}.`
        : "Payment recorded, but saving failed.",
      !saved
    );
  } catch (error) {
    notify(error.message, true);
  }
});

// Close the week and record the payout.
$("close-week").addEventListener("click", () => {
  try {
    const payout = group.closeWeek();
    const saved = saveGroup();

    render();

    notify(
      saved
        ? `Week ${payout.week} saved. ${payout.memberName} received ${money(payout.amount)}.`
        : "Payout recorded, but saving failed.",
      !saved
    );
  } catch (error) {
    notify(error.message, true);
  }
});

// Show the saved group as soon as the page opens.
render();

