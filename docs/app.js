import { SusuGroup } from "/susu.js";
let group = new SusuGroup({name:"Community Susu", weeklyContribution:50});
const $ = id => document.getElementById(id);
let toastTimer;
const money = n => new Intl.NumberFormat("en-GH",{style:"currency",currency:"GHS"}).format(n);
function safe(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function notify(message,error=false){const t=$("toast");t.textContent=message;t.style.background=error?"#8e352e":"#193d2d";t.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),3000);}
function render(){
 const r=group.report();
 $("stat-pot").textContent=money(r.currentPot);$("stat-members").textContent=r.memberCount;$("stat-week").textContent=r.currentWeek;$("stat-payouts").textContent=r.payouts.length;
 $("member-count").textContent=`${r.memberCount} member${r.memberCount===1?"":"s"}`;$("payout-count").textContent=`${r.payouts.length} payout${r.payouts.length===1?"":"s"}`;$("week-tag").textContent=`Week ${r.currentWeek}`;
 $("members-list").className="list"+(r.memberCount?"":" empty");
 $("members-list").innerHTML=r.memberCount?r.balances.map(({member,paid})=>`<div class="member"><div class="avatar">${safe(member.name.split(/\s+/).map(x=>x[0]).join("").slice(0,2).toUpperCase())}</div><div class="member-info"><strong>${safe(member.name)}</strong><small>${safe(member.id)} · ${money(paid)} paid this week</small></div><span class="hint">#${member.joinOrder}</span></div>`).join(""):"Add your first member to get started.";
 const select=$("payment-member"),old=select.value;
 select.innerHTML=r.memberCount?r.balances.map(({member})=>`<option value="${safe(member.id)}">${safe(member.name)}</option>`).join(""):'<option value="">Add members first</option>';
 if(r.balances.some(x=>x.member.id===old))select.value=old;
 select.disabled=!r.memberCount||r.cycleComplete;$("payment-amount").disabled=!r.memberCount||r.cycleComplete;$("close-week").disabled=r.cycleComplete;$("close-week").textContent=r.cycleComplete?"Savings cycle complete":"Close week & pay out";
 $("balances-body").innerHTML=r.memberCount?r.balances.map(({member,paid,owed})=>{const pct=Math.min(100,Math.round(paid/r.weeklyContribution*100));return `<tr><td><div class="person"><span class="mini">${safe(member.name[0].toUpperCase())}</span>${safe(member.name)}</div></td><td>${money(paid)}</td><td class="${owed?"owed":""}">${money(owed)}</td><td><div class="track" aria-label="${pct}% paid"><span style="width:${pct}%"></span></div></td><td><span class="status ${owed?"due":"paid"}">${owed?"Payment due":"Paid in full"}</span></td></tr>`}).join(""):'<tr><td colspan="5" class="empty">Your balances will appear here.</td></tr>';
 $("payout-history").className="list"+(r.payouts.length?"":" empty");
 $("payout-history").innerHTML=r.payouts.length?[...r.payouts].reverse().map(p=>`<div class="history"><div class="history-icon">↗</div><div class="history-info"><strong>${safe(p.memberName)} received the pot</strong><small>Week ${p.week} · ${safe(p.memberId)}</small></div><div class="amount">${money(p.amount)}</div></div>`).join(""):"Payouts will appear here after a week is closed.";
}
$("group-form").addEventListener("submit",e=>{e.preventDefault();try{const name=$("group-name").value.trim(),amount=Number($("weekly-amount").value);if(!name)throw Error("Group name is required.");if(!Number.isFinite(amount)||amount<=0||Math.round(amount*100)!==amount*100)throw Error("Enter a positive amount with up to two decimal places.");if(group.payouts.length||group.members.some(m=>group.amountPaid(m.id)>0)){notify("Settings cannot change after payments begin.",true);return;}const names=group.members.map(m=>m.name);group=new SusuGroup({name,weeklyContribution:amount});names.forEach(n=>group.addMember(n));render();notify("Group settings updated.");}catch(err){notify(err.message,true);}});
$("member-form").addEventListener("submit",e=>{e.preventDefault();try{if(group.payouts.length)throw Error("You cannot add members after the first payout.");group.addMember($("member-name").value);$("member-name").value="";render();notify("Member added.");}catch(err){notify(err.message,true);}});
$("payment-form").addEventListener("submit",e=>{e.preventDefault();try{const result=group.recordContribution($("payment-member").value,Number($("payment-amount").value));$("payment-amount").value="";render();notify(`Payment recorded. Remaining: ${money(result.owed)}.`);}catch(err){notify(err.message,true);}});
$("close-week").addEventListener("click",()=>{try{const p=group.closeWeek();render();notify(`Week ${p.week} complete. ${p.memberName} received ${money(p.amount)}.`);}catch(err){notify(err.message,true);}});
render();
