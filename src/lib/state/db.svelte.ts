import { authState } from "./auth.svelte.js";
import initialData from "../data/mockDatabase.json";

function loadData() {
  // Always start with a fresh copy of initialData for every session refresh
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
  // Persistence disabled per user request to reset on refresh/restart
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
  const payout = dbStore.payouts.find((p: any) => p.id === payoutId);
  if (!payout) return;

  dbStore.payouts = dbStore.payouts.map((p: any) =>
    p.id === payoutId ? { ...p, status: "Ready to redeem" } : p
  );

  // Provide a notification to the actual payee account about the approved payout
  const newNotif = {
    id: `notif_${Math.floor(Math.random() * 10000)}`,
    userId: payout.userId,
    title: "Payment Approved",
    message: `Your payout for Claim No. ${payout.claimNo} has been approved and is ready to redeem.`,
    read: false,
    date: new Date().toISOString()
  };

  dbStore.notifications = [newNotif, ...dbStore.notifications];
  saveDb();
}

export function createPayout(amount: string, programId: string, payee: string) {
  // Remove currency symbol and commas before parsing
  const cleanAmount = amount.replace(/[₹,]/g, '');
  const amountNumber = parseInt(cleanAmount, 10);
  
  // Apply threshold logic: payouts > 51k require approval
  const initialStatus = amountNumber > 51000 ? "Pending" : "Ready to redeem";

  // Look up the actual payee ID by matching the name or businessName robustly
  const cleanPayee = payee.trim().toLowerCase();
  const targetUser = dbStore.users.find(
    (u: any) => 
      (u.name && u.name.toLowerCase() === cleanPayee) || 
      (u.businessName && u.businessName.toLowerCase() === cleanPayee) ||
      (u.email && u.email.toLowerCase() === cleanPayee)
  );
  
  // If we can't strictly match the UI name to a DB user, we create a phantom ID tied to the string name
  // so it at least maps correctly if they register later, rather than dumping it into usr_payee_01 statically.
  const targetId = targetUser ? targetUser.id : `usr_pending_${cleanPayee.replace(/[^a-z0-9]/g, '')}`;

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

export function createProgram(name: string, type: string, category: string, payeeEmails: string[] = []) {
  if (!authState.user?.id) return;

  // Map incoming emails to actual user IDs
  const targetIds = payeeEmails.map(email => {
    const targetUser = dbStore.users.find((u: any) => u.email === email);
    return targetUser ? targetUser.id : email;
  });

  const newProgram = {
    id: `prog_med_${Math.floor(Math.random() * 10000)}`,
    name: name,
    payerId: authState.user.id,
    status: "Active",
    category: category,
    createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    createdBy: authState.user.name || "System",
    payoutsReceived: 0,
    enrolledPayees: [],
    invitedPayees: targetIds
  };
  
  // Also push a demo notification allowing the Payer to see they made a program
  const newNotif = {
    id: `notif_${Math.floor(Math.random() * 10000)}`,
    userId: authState.user.id,
    title: "Program Configured Successfully",
    message: `Payment Program "${name}" for ${type} (${category}) is now active.`,
    read: false,
    date: new Date().toISOString()
  };

  dbStore.programs = [newProgram, ...dbStore.programs];
  dbStore.notifications = [newNotif, ...dbStore.notifications];

  targetIds.forEach(targetId => {
    const payeeNotif = {
      id: `notif_${Math.floor(Math.random() * 10000)}`,
      userId: targetId,
      title: "New Program Invitation",
      message: `You have been added to the "${name}" payment program by your payer. Do you wish to accept?`,
      read: false,
      type: "invitation",
      programId: newProgram.id,
      date: new Date().toISOString()
    };
    dbStore.notifications = [payeeNotif, ...dbStore.notifications];
  });
  saveDb();
}

export function acceptInvitation(notificationId: string, programId: string, payeeId: string) {
  // Add payee to program
  dbStore.programs = dbStore.programs.map((p: any) => {
    if (p.id === programId && !p.enrolledPayees.includes(payeeId)) {
      const updatedInvited = (p.invitedPayees || []).filter((id: string) => id !== payeeId);
      return { 
        ...p, 
        enrolledPayees: [...p.enrolledPayees, payeeId],
        invitedPayees: updatedInvited
      };
    }
    return p;
  });

  // Reconcile pending payouts assigned to phantom IDs for this program
  dbStore.payouts = dbStore.payouts.map((p: any) => {
    if (p.programId === programId && String(p.userId).startsWith("usr_pending_")) {
      return { ...p, userId: payeeId };
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

export function updateProgram(id: string, name: string, type: string, category: string, payeeEmails: string[] = []) {
  const targetIds = payeeEmails.map(email => {
    const targetUser = dbStore.users.find((u: any) => u.email === email);
    return targetUser ? targetUser.id : email;
  });

  dbStore.programs = dbStore.programs.map((p: any) => {
    if (p.id === id) {
      const updated = { ...p, name, category };
      
      // Add all new IDs that aren't already enrolled
      targetIds.forEach(targetId => {
        if (!updated.enrolledPayees.includes(targetId) && !updated.invitedPayees?.includes(targetId)) {
          updated.invitedPayees = [...(updated.invitedPayees || []), targetId];
        }
      });
      
      return updated;
    }
    return p;
  });

  targetIds.forEach(targetId => {
    const alreadyInvited = dbStore.notifications.some(
      (n: any) => n.userId === targetId && n.programId === id
    );

    const programToUpdate = dbStore.programs.find((p: any) => p.id === id);
    const alreadyEnrolled = programToUpdate?.enrolledPayees.includes(targetId);

    if (!alreadyInvited && !alreadyEnrolled) {
      const payeeNotif = {
        id: `notif_${Math.floor(Math.random() * 10000)}`,
        userId: targetId,
        title: "New Program Invitation",
        message: `You have been added to the "${name}" payment program by your payer. Do you wish to accept?`,
        read: false,
        type: "invitation",
        programId: id,
        date: new Date().toISOString()
      };
      dbStore.notifications = [payeeNotif, ...dbStore.notifications];
    }
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
