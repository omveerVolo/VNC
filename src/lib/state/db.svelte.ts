import { authState } from "./auth.svelte.js";
import initialData from "../data/mockDatabase.json";

function loadData() {
  if (typeof window !== "undefined") {
    const version = localStorage.getItem("dbVersion");
    if (version === "8") {
      const saved = localStorage.getItem("dbStore");
      if (saved) return JSON.parse(saved);
    } else {
      localStorage.setItem("dbVersion", "8");
      localStorage.removeItem("dbStore");
    }
  }
  return JSON.parse(JSON.stringify(initialData));
}

const activeContext = loadData();

export const dbStore = $state({
  users: activeContext.users,
  programs: activeContext.programs,
  notifications: activeContext.notifications,
  payouts: activeContext.payouts
});

function saveDb() {
  if (typeof window !== "undefined") {
    localStorage.setItem("dbStore", JSON.stringify({
      users: dbStore.users,
      programs: dbStore.programs,
      notifications: dbStore.notifications,
      payouts: dbStore.payouts
    }));
  }
}

export function redeemPayout(payoutId: string) {
  // Reassign the array to securely trigger Svelte 5 reactivity across derived trackers
  dbStore.payouts = dbStore.payouts.map((p: any) =>
    p.id === payoutId ? { ...p, status: "Redeemed" } : p
  );
  saveDb();
}

export function registerUser(user: any) {
  dbStore.users = [...dbStore.users, user];
  console.log("Current Users array:", dbStore.users);
  saveDb();
}

export function approvePayerPayout(payoutId: string) {
  dbStore.payouts = dbStore.payouts.map((p: any) =>
    p.id === payoutId ? { ...p, status: "Ready to redeem" } : p
  );
  saveDb();
}

export function createPayout(amount: string, programId: string, payee: string) {
  const cleanAmount = amount.replace(/,/g, '');
  const amountNumber = parseInt(cleanAmount, 10);
  const initialStatus = amountNumber > 50000 ? "Pending Payer" : "Ready to redeem";

  // Look up the actual payee ID by matching the name or businessName
  const targetUser = dbStore.users.find(
    (u: any) => u.name === payee || u.businessName === payee
  );
  const targetId = targetUser ? targetUser.id : "usr_payee_01";

  const newPayout = {
    id: `clm_${Math.floor(Math.random() * 10000)}`,
    userId: targetId,
    programId: programId,
    date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    providerName: payee,
    patientName: "Newly Assigned",
    claimNo: `VADE${Math.floor(Math.random() * 1000000)}`,
    payoutId: `ACME${Math.floor(Math.random() * 100000000)}`,
    amount: cleanAmount,
    status: initialStatus
  };
  
  // Prepend to array and reassign to trigger reactivity
  dbStore.payouts = [newPayout, ...dbStore.payouts];

  // Provide a notification to the actual payee account about the new payout
  const newNotif = {
    id: `notif_${Math.floor(Math.random() * 10000)}`,
    userId: targetId, // The targeted payee ID
    title: "New Payment Created",
    message: `A new payout of ₹${formatCurrency(amount)} mapped to Claim No. ${newPayout.claimNo} has been created for you.`,
    read: false,
    date: new Date().toISOString() // We can use ISO strings for robust sorting
  };
  
  dbStore.notifications = [newNotif, ...dbStore.notifications];
  saveDb();
}

export function createProgram(name: string, type: string, category: string, payeeEmail?: string) {
  const newProgram = {
    id: `prog_med_${Math.floor(Math.random() * 10000)}`,
    name: name,
    payerId: authState.user?.id || "usr_payer_01",
    status: "Active",
    category: category,
    createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    createdBy: "System Input",
    payoutsReceived: 0,
    enrolledPayees: payeeEmail ? [payeeEmail] : [] // starts empty unless invited
  };
  
  // Also push a demo notification allowing the Payer to see they made a program
  const newNotif = {
    id: `notif_${Math.floor(Math.random() * 10000)}`,
    userId: authState.user?.id || "usr_payer_01",
    title: "Program Configured Successfully",
    message: `Payment Program "${name}" for ${type} (${category}) is now active.`,
    read: false,
    date: new Date().toISOString()
  };

  dbStore.programs = [newProgram, ...dbStore.programs];
  dbStore.notifications = [newNotif, ...dbStore.notifications];

  if (payeeEmail) {
    const payeeNotif = {
      id: `notif_${Math.floor(Math.random() * 10000)}`,
      userId: payeeEmail, // using email as ID for the demo payload
      title: "New Program Invitation",
      message: `You have been added to the "${name}" payment program by your payer. Do you wish to accept?`,
      read: false,
      type: "invitation",
      programId: newProgram.id,
      date: new Date().toISOString()
    };
    dbStore.notifications = [payeeNotif, ...dbStore.notifications];
  }
  saveDb();
}

export function acceptInvitation(notificationId: string, programId: string, payeeId: string) {
  // Add payee to program
  dbStore.programs = dbStore.programs.map((p: any) => {
    if (p.id === programId && !p.enrolledPayees.includes(payeeId)) {
      return { ...p, enrolledPayees: [...p.enrolledPayees, payeeId] };
    }
    return p;
  });

  // Remove or Mark Notification as actioned
  dbStore.notifications = dbStore.notifications.filter((n: any) => n.id !== notificationId);
  saveDb();
}

export function rejectInvitation(notificationId: string) {
  // Just dismiss the notification entirely
  dbStore.notifications = dbStore.notifications.filter((n: any) => n.id !== notificationId);
  saveDb();
}

export function updateProgram(id: string, name: string, type: string, category: string, payeeEmail?: string) {
  dbStore.programs = dbStore.programs.map((p: any) => {
    if (p.id === id) {
      const updated = { ...p, name, category };
      if (payeeEmail && !updated.enrolledPayees.includes(payeeEmail)) {
        updated.enrolledPayees = [...updated.enrolledPayees, payeeEmail];
      }
      return updated;
    }
    return p;
  });
  saveDb();
}

export function cancelEnrollment(programId: string, payeeId: string) {
  // Removes the payee ID from the program's enrolled array
  dbStore.programs = dbStore.programs.map((program: any) => {
    if (program.id === programId) {
      return {
        ...program,
        enrolledPayees: program.enrolledPayees.filter((id: string) => id !== payeeId)
      };
    }
    return program;
  });
  saveDb();
}

function formatCurrency(rawAmount: any) {
  if (!rawAmount) return "0";
    if (typeof rawAmount === "number") return rawAmount.toLocaleString("en-IN");
    return String(rawAmount).replace("₹", "");
  }
