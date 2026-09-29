// API base now comes from config.js so this file never needs editing
// just to point at a different backend host/port.
const API = (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) || 'http://localhost:8080/api';
const state = { token: localStorage.getItem('finora_token'), email: localStorage.getItem('finora_email'), role: localStorage.getItem('finora_role'), page: 'dashboard', data: {}, filters: {}, loading:false };

const NAV = [
  ['dashboard','Dashboard','layout-dashboard'],
  ['users','Users','users','ADMIN'],
  ['savings','Savings Accounts','wallet-cards'],
  ['transactions','Transactions','arrow-left-right'],
  ['fd','Fixed Deposits','landmark'],
  ['rd','Recurring Deposits','repeat-2'],
  ['loans','Loans','hand-coins'],
  ['emi','EMI Schedule','calendar-clock'],
  ['profile','My Profile','user-round']
];
const META = {
  dashboard:['Overview','Dashboard'], users:['Administration','Users'], savings:['Accounts','Savings Accounts'], transactions:['Money movement','Transactions'], fd:['Investments','Fixed Deposits'], rd:['Investments','Recurring Deposits'], loans:['Credit','Loans'], emi:['Repayment','EMI Schedule'], profile:['Account','My Profile']
};

// Human-friendly placeholder text for every form field that appears
// anywhere in the app. Falls back to an auto-generated "Enter <field>"
// sentence for any field name not listed explicitly.
const PLACEHOLDERS = {
  name: 'Enter your full name',
  email: 'Enter your email',
  mobile: 'Enter your mobile number',
  password: 'Enter your password',
  gender: 'Enter gender (Male / Female / Other)',
  address: 'Enter your address',
  role: 'Select role',
  userId: 'Enter the user ID',
  accountNumber: 'Enter account number',
  accountType: 'e.g. Savings, Current',
  balance: 'Enter opening balance',
  status: 'Enter status',
  savingAccountId: 'Enter saving account ID',
  type: 'Select transaction type',
  amount: 'Enter amount',
  description: 'Enter a short description',
  depositAmount: 'Enter deposit amount',
  tenureMonths: 'Enter tenure in months',
  interestRate: 'Enter interest rate (%)',
  monthlyInstallment: 'Enter monthly installment amount',
  loanAmount: 'Enter loan amount',
  purpose: 'Enter the purpose of the loan'
};
function placeholderFor(name){
  if (PLACEHOLDERS[name]) return PLACEHOLDERS[name];
  const words = String(name).replace(/([A-Z])/g,' $1').toLowerCase().trim();
  return `Enter ${words}`;
}

function esc(v){return String(v ?? '').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function money(v){const n=Number(v||0);return new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(n);}
function date(v){if(!v)return '—';return new Date(v).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});}
function status(v){const s=String(v||'').toUpperCase();let cls='bg-slate-100 text-slate-600';if(['ACTIVE','APPROVED','PAID','COMPLETED','DISBURSED'].includes(s))cls='bg-emerald-50 text-emerald-700';if(['PENDING','PROCESSING'].includes(s))cls='bg-amber-50 text-amber-700';if(['REJECTED','CLOSED','FAILED','OVERDUE'].includes(s))cls='bg-rose-50 text-rose-700';return `<span class="badge ${cls}">${esc(s||'N/A')}</span>`;}
function initials(s){return (s||'U').split(/[ @._-]+/).filter(Boolean).slice(0,2).map(x=>x[0].toUpperCase()).join('')||'U';}
function toast(message,type='success'){const root=document.getElementById('toast-root');const el=document.createElement('div');el.className=`toast ${type}`;el.innerHTML=`<i data-lucide="${type==='success'?'check-circle-2':type==='error'?'circle-alert':'info'}"></i><div class="text-sm font-medium text-slate-700 leading-5">${esc(message)}</div>`;root.appendChild(el);lucide.createIcons();setTimeout(()=>el.remove(),3600);}
function togglePassword(id,btn){const input=document.getElementById(id);input.type=input.type==='password'?'text':'password';btn.innerHTML=`<i data-lucide="${input.type==='password'?'eye':'eye-off'}"></i>`;lucide.createIcons();}
function apiFetch(path,options={}){const headers={'Content-Type':'application/json',...(options.headers||{})};if(state.token)headers.Authorization=`Bearer ${state.token}`;return fetch(API+path,{...options,headers}).then(async r=>{const text=await r.text();let body={};try{body=text?JSON.parse(text):{}}catch{body={message:text}}if(r.status===401||r.status===403){if(path!=='/auth/login')toast(r.status===403?'You do not have permission for this action.':'Session expired. Please sign in again.','error');}if(!r.ok)throw new Error(body.message||body.error||`Request failed (${r.status})`);return body;}).catch(err=>{if(err instanceof TypeError){throw new Error('Could not reach the backend API. Check that the Spring Boot server is running and that CORS is enabled (see README.md).');}throw err;});}
function saveAuth(res){state.token=res.token;state.email=res.email;state.role=res.role;localStorage.setItem('finora_token',res.token);localStorage.setItem('finora_email',res.email);localStorage.setItem('finora_role',res.role);}
function logout(){localStorage.clear();state.token=null;state.email=null;state.role=null;document.getElementById('app-screen').classList.add('hidden');document.getElementById('auth-screen').classList.remove('hidden');document.getElementById('profile-menu').classList.add('hidden');}
function toggleProfile(){document.getElementById('profile-menu').classList.toggle('hidden');}
function openSidebar(){document.getElementById('sidebar').classList.add('open');document.getElementById('mobile-overlay').classList.remove('hidden')}
function closeSidebar(){document.getElementById('sidebar').classList.remove('open');document.getElementById('mobile-overlay').classList.add('hidden')}
function navigate(page){state.page=page;document.getElementById('profile-menu').classList.add('hidden');closeSidebar();renderNav();const m=META[page]||META.dashboard;document.getElementById('page-eyebrow').textContent=m[0];document.getElementById('page-title').textContent=m[1];renderPage();}
function renderNav(){const n=document.getElementById('nav');n.innerHTML=NAV.filter(x=>!x[3]||state.role==='ADMIN').map(([id,label,icon])=>`<button class="nav-item ${state.page===id?'active':''}" onclick="navigate('${id}')"><i data-lucide="${icon}"></i><span>${label}</span></button>`).join('');lucide.createIcons();}
function setupUser(){const email=state.email||'User';const role=state.role||'CUSTOMER';['side-email','header-email'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=email;});['side-role','header-role'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=role;});['side-avatar','header-avatar'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=initials(email);});}

async function renderPage(){const c=document.getElementById('content');c.innerHTML=`<div class="data-card p-8"><div class="skeleton w-1/3 mb-4"></div><div class="skeleton w-full"></div></div>`;try{if(state.page==='dashboard')return await dashboard(c);if(state.page==='users')return await users(c);if(state.page==='savings')return await savingAccountsPage(c);if(state.page==='transactions')return await transactionPage(c);if(state.page==='fd')return await fdPage(c);if(state.page==='rd')return await rdPage(c);if(state.page==='loans')return await loanPage(c);if(state.page==='emi')return await modulePage(c,'emi');if(state.page==='profile')return profile(c);}catch(e){c.innerHTML=`<div class="data-card p-8 text-center"><div class="mini-icon mx-auto mb-4"><i data-lucide="circle-alert"></i></div><h3 class="font-bold">Could not load this page</h3><p class="mt-2 text-sm text-slate-500">${esc(e.message)}</p><button class="ghost-btn mt-5" onclick="refreshCurrent()"><i data-lucide="refresh-cw"></i> Try again</button></div>`;lucide.createIcons();}}
function refreshCurrent(){renderPage();}

async function dashboard(c){const [users,savings,tx,fd,rd,loans]=await Promise.allSettled([apiFetch('/users'),apiFetch('/savings'),apiFetch('/transactions'),apiFetch('/fd'),apiFetch('/rd'),apiFetch('/loans')]);const val=x=>x.status==='fulfilled'?(Array.isArray(x.value)?x.value:[]):[];const u=val(users),s=val(savings),t=val(tx),f=val(fd),r=val(rd),l=val(loans);state.data={users:u,savings:s,transactions:t,fd:f,rd:r,loans:l};const balance=s.reduce((a,x)=>a+Number(x.balance||0),0),invest=f.reduce((a,x)=>a+Number(x.depositAmount||0),0)+r.reduce((a,x)=>a+Number(x.totalDeposited||0),0),outstanding=l.reduce((a,x)=>a+Number(x.outstandingAmount||0),0);const recent=t.slice().sort((a,b)=>new Date(b.transactionDate)-new Date(a.transactionDate)).slice(0,5);c.innerHTML=`<div class="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p class="text-sm text-slate-500">Good to see you, ${esc(state.email?.split('@')[0]||'there')}.</p><h2 class="mt-1 text-2xl font-bold">Your financial overview</h2></div><button class="primary-btn" onclick="navigate('transactions')"><i data-lucide="plus"></i> New transaction</button></div><div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><div class="stat-card"><div class="flex items-center justify-between"><div class="mini-icon"><i data-lucide="wallet-cards"></i></div>${status('ACTIVE')}</div><p class="mt-5 text-xs font-semibold uppercase tracking-widest text-slate-400">Total balance</p><p class="mt-1 text-2xl font-bold">${money(balance)}</p><p class="mt-1 text-xs text-slate-500">Across ${s.length} saving account(s)</p></div><div class="stat-card"><div class="mini-icon"><i data-lucide="trending-up"></i></div><p class="mt-5 text-xs font-semibold uppercase tracking-widest text-slate-400">Deposits</p><p class="mt-1 text-2xl font-bold">${money(invest)}</p><p class="mt-1 text-xs text-slate-500">FD + RD contributions</p></div><div class="stat-card"><div class="mini-icon"><i data-lucide="hand-coins"></i></div><p class="mt-5 text-xs font-semibold uppercase tracking-widest text-slate-400">Loan outstanding</p><p class="mt-1 text-2xl font-bold">${money(outstanding)}</p><p class="mt-1 text-xs text-slate-500">${l.length} loan record(s)</p></div><div class="stat-card"><div class="mini-icon"><i data-lucide="arrow-left-right"></i></div><p class="mt-5 text-xs font-semibold uppercase tracking-widest text-slate-400">Transactions</p><p class="mt-1 text-2xl font-bold">${t.length}</p><p class="mt-1 text-xs text-slate-500">Latest activity available</p></div></div><div class="mt-6 grid gap-6 xl:grid-cols-[1.4fr_.8fr]"><div class="data-card"><div class="flex items-center justify-between p-5"><div><h3 class="font-bold">Recent transactions</h3><p class="mt-1 text-xs text-slate-500">Latest money movement</p></div><button class="ghost-btn" onclick="navigate('transactions')">View all</button></div>${recent.length?`<div class="table-wrap"><table class="data-table"><thead><tr><th>Reference</th><th>Type</th><th>Amount</th><th>Date</th></tr></thead><tbody>${recent.map(x=>`<tr><td class="font-semibold">${esc(x.transactionReference)}</td><td>${esc(x.type)}</td><td class="font-semibold">${money(x.amount)}</td><td>${date(x.transactionDate)}</td></tr>`).join('')}</tbody></table></div>`:`<div class="empty"><i data-lucide="receipt-text"></i><p>No transactions yet.</p></div>`}</div><div class="data-card p-5"><div class="flex items-center gap-3"><div class="mini-icon"><i data-lucide="sparkles"></i></div><div><h3 class="font-bold">Quick actions</h3><p class="text-xs text-slate-500">Jump into common tasks</p></div></div><div class="mt-5 grid gap-2">${[['savings','Open savings account','wallet-cards'],['fd','Create fixed deposit','landmark'],['rd','Start recurring deposit','repeat-2'],['loans','Apply for a loan','hand-coins'],['emi','Check EMI schedule','calendar-clock']].map(x=>`<button class="ghost-btn justify-start" onclick="navigate('${x[0]}')"><i data-lucide="${x[2]}"></i>${x[1]}<i data-lucide="arrow-up-right" class="ml-auto"></i></button>`).join('')}</div></div></div>`;lucide.createIcons();}

async function users(c){const rows=await apiFetch('/users');state.data.users=rows;const roles=[...new Set(rows.map(x=>x.role).filter(Boolean))].sort();const toolbar=`<div class="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p class="text-sm font-semibold">${rows.length} record(s)</p><p class="text-xs text-slate-400">Data is loaded directly from your Spring Boot APIs.</p></div><div class="toolbar-wrap"><input id="table-search" class="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none" placeholder="Search by name, email or mobile..." oninput="filterTable()"><select id="filter-role" class="toolbar-select" onchange="filterTable()"><option value="">All roles</option>${roles.map(r=>`<option value="${esc(r)}">${esc(r)}</option>`).join('')}</select><button class="ghost-btn" onclick="refreshCurrent()"><i data-lucide="refresh-cw"></i>Refresh</button></div></div>`;const table=`<div class="table-wrap"><table id="module-table" class="data-table"><thead><tr><th>User</th><th>Email</th><th>Mobile</th><th>Gender</th><th>Role</th><th>Actions</th></tr></thead><tbody>${rows.length?rows.map(x=>`<tr data-search="${esc(JSON.stringify(x).toLowerCase())}" data-role="${esc((x.role||'').toLowerCase())}"><td><div class="flex items-center gap-3"><div class="avatar">${initials(x.name)}</div><div><div class="font-semibold">${esc(x.name)}</div><div class="text-xs text-slate-400">ID #${x.id}</div></div></div></td><td>${esc(x.email)}</td><td>${esc(x.mobile)}</td><td>${esc(x.gender||'—')}</td><td>${status(x.role)}</td><td><div class="action-row"><button class="action-btn" onclick='openUserForm(${JSON.stringify(x)})'><i data-lucide="pencil"></i>Edit</button><button class="action-btn" onclick="deleteRecord('users',${x.id})"><i data-lucide="trash-2"></i>Delete</button></div></td></tr>`).join(''):`<tr><td colspan="6"><div class="empty"><i data-lucide="users"></i><p>No users found.</p></div></td></tr>`}</tbody></table></div>`;c.innerHTML=moduleShell('Users','Manage registered customers and administrators','user-plus','Add user','openUserForm()',toolbar+table);lucide.createIcons();}

const CONFIG={
 savings:{title:'Savings Accounts',subtitle:'Track balances and account status',icon:'wallet-cards',endpoint:'/savings',create:'Create account',fields:[['userId','User ID','number'],['accountNumber','Account number','text'],['accountType','Account type','text'],['balance','Opening balance','number'],['status','Status','text']],cols:[['accountNumber','Account'],['userId','User ID'],['accountType','Type'],['balance','Balance','money'],['status','Status','status']]},
 transactions:{title:'Transactions',subtitle:'Deposits and withdrawals with live balances',icon:'arrow-left-right',endpoint:'/transactions',create:'New transaction',fields:[['savingAccountId','Saving account ID','number'],['type','Type','select','DEPOSIT,WITHDRAWAL'],['amount','Amount','number'],['description','Description','text']],cols:[['transactionReference','Reference'],['savingAccountId','Account ID'],['type','Type','status'],['amount','Amount','money'],['balanceAfterTransaction','Balance after','money'],['transactionDate','Date','date']]},
 fd:{title:'Fixed Deposits',subtitle:'Create and monitor fixed-term investments',icon:'landmark',endpoint:'/fd',create:'Create FD',fields:[['userId','User ID','number'],['depositAmount','Deposit amount','number'],['tenureMonths','Tenure (months)','number'],['interestRate','Interest rate (%)','number']],cols:[['fdNumber','FD Number'],['userId','User ID'],['depositAmount','Deposit','money'],['interestRate','Rate'],['maturityAmount','Maturity','money'],['maturityDate','Maturity date','date'],['status','Status','status']]},
 rd:{title:'Recurring Deposits',subtitle:'Build savings through monthly installments',icon:'repeat-2',endpoint:'/rd',create:'Create RD',fields:[['userId','User ID','number'],['monthlyInstallment','Monthly installment','number'],['tenureMonths','Tenure (months)','number'],['interestRate','Interest rate (%)','number']],cols:[['rdNumber','RD Number'],['userId','User ID'],['monthlyInstallment','Monthly installment','money'],['installmentsPaid','Paid'],['maturityAmount','Maturity','money'],['maturityDate','Maturity date','date'],['status','Status','status']]},
 loans:{title:'Loans',subtitle:'Applications, approvals and repayment tracking',icon:'hand-coins',endpoint:'/loans',create:'Apply for loan',fields:[['userId','User ID','number'],['loanAmount','Loan amount','number'],['interestRate','Interest rate (%)','number'],['tenureMonths','Tenure (months)','number'],['purpose','Purpose','text']],cols:[['loanNumber','Loan Number'],['userId','User ID'],['loanAmount','Amount','money'],['emiAmount','EMI','money'],['outstandingAmount','Outstanding','money'],['status','Status','status']]},
 emi:{title:'EMI Schedule',subtitle:'Generate schedules and record EMI payments',icon:'calendar-clock',endpoint:'/emi-schedules',create:null,fields:[],cols:[['emiNumber','EMI #'],['loanId','Loan ID'],['dueDate','Due date','date'],['emiAmount','EMI','money'],['principalAmount','Principal','money'],['interestAmount','Interest','money'],['paidAmount','Paid','money'],['status','Status','status'],['paymentDate','Payment date','date']]}
};
function moduleShell(title,subtitle,icon,btn,onclick,body){return `<div class="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div class="flex items-center gap-3"><div class="mini-icon"><i data-lucide="${icon}"></i></div><div><h2 class="text-2xl font-bold">${title}</h2><p class="mt-1 text-sm text-slate-500">${subtitle}</p></div></div></div>${btn?`<button class="primary-btn" onclick="${onclick}"><i data-lucide="plus"></i>${btn}</button>`:''}</div><div class="data-card">${body}</div>`;}

// Any column marked 'status' in cfg.cols becomes a filter dropdown automatically,
// populated with the distinct values actually present in the loaded rows.
function filterableCols(cfg){return cfg.cols.filter(c=>c[2]==='status');}
function toolbarHtml(cfg,rows){const filters=filterableCols(cfg);const selects=filters.map(col=>{const values=[...new Set(rows.map(r=>r[col[0]]).filter(v=>v!==null&&v!==undefined&&v!==''))].sort();return `<select id="filter-${col[0]}" class="toolbar-select" onchange="filterTable()"><option value="">All ${col[1].toLowerCase()}</option>${values.map(v=>`<option value="${esc(String(v).toLowerCase())}">${esc(v)}</option>`).join('')}</select>`;}).join('');return `<div class="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p class="text-sm font-semibold">${rows.length} record(s)</p><p class="text-xs text-slate-400">Data is loaded directly from your Spring Boot APIs.</p></div><div class="toolbar-wrap"><input id="table-search" class="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none" placeholder="Search records..." oninput="filterTable()">${selects}<button class="ghost-btn" onclick="refreshCurrent()"><i data-lucide="refresh-cw"></i>Refresh</button></div></div>`;}
async function transactionPage(c){
  const rows=await apiFetch('/transactions');
  state.data.transactions=Array.isArray(rows)?rows:[];
  const deposits=state.data.transactions.filter(x=>x.type==='DEPOSIT').reduce((a,x)=>a+Number(x.amount||0),0);
  const withdrawals=state.data.transactions.filter(x=>x.type==='WITHDRAWAL').reduce((a,x)=>a+Number(x.amount||0),0);
  const renderRows=(list)=>list.length?list.map(x=>`<tr>
    <td><div class="font-semibold text-slate-800">${esc(x.transactionReference||'—')}</div><div class="text-xs text-slate-400">Transaction #${esc(x.id)}</div></td>
    <td>${esc(x.savingAccountId)}</td>
    <td>${status(x.type)}</td>
    <td class="font-semibold">${money(x.amount)}</td>
    <td>${money(x.balanceAfterTransaction)}</td>
    <td>${date(x.transactionDate)}</td>
    <td><div class="action-row">
      <button class="action-btn" title="View payment slip" onclick="viewTransaction(${x.id})"><i data-lucide="receipt-text"></i>View</button>
      <button class="action-btn" title="Share payment slip" onclick="shareTransactionFromTable(${x.id})"><i data-lucide="share-2"></i>Share</button>
      <button class="action-btn" title="Download payment slip" onclick="downloadTransactionFromTable(${x.id})"><i data-lucide="download"></i>Download</button>
    </div></td>
  </tr>`).join(''):`<tr><td colspan="7"><div class="empty"><i data-lucide="inbox"></i><p>No transactions found.</p></div></td></tr>`;
  c.innerHTML=`<div class="mb-7 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
    <div><p class="text-sm text-slate-500">Money movement and payment history</p><h2 class="mt-1 text-2xl font-bold">Transactions</h2></div>
    <button class="primary-btn" onclick="openGenericForm('transactions')"><i data-lucide="plus"></i>New transaction</button>
  </div>
  <div class="grid gap-4 sm:grid-cols-3">
    <div class="stat-card"><div class="mini-icon"><i data-lucide="arrow-down-left"></i></div><p class="mt-4 text-xs font-semibold uppercase tracking-widest text-slate-400">Total deposits</p><p class="mt-1 text-xl font-bold">${money(deposits)}</p></div>
    <div class="stat-card"><div class="mini-icon"><i data-lucide="arrow-up-right"></i></div><p class="mt-4 text-xs font-semibold uppercase tracking-widest text-slate-400">Total withdrawals</p><p class="mt-1 text-xl font-bold">${money(withdrawals)}</p></div>
    <div class="stat-card"><div class="mini-icon"><i data-lucide="receipt"></i></div><p class="mt-4 text-xs font-semibold uppercase tracking-widest text-slate-400">Transactions</p><p class="mt-1 text-xl font-bold">${state.data.transactions.length}</p></div>
  </div>
  <div class="data-card mt-6">
    <div class="flex flex-col gap-3 border-b border-slate-100 p-5 md:flex-row md:items-center">
      <div class="input-wrap flex-1"><i data-lucide="search"></i><input id="tx-search" oninput="filterTransactions()" placeholder="Search reference, account ID, description..."></div>
      <select id="tx-type" onchange="filterTransactions()" class="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none"><option value="ALL">All types</option><option value="DEPOSIT">Deposit</option><option value="WITHDRAWAL">Withdrawal</option></select>
      <input id="tx-from" type="date" onchange="filterTransactions()" class="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none" title="From date">
      <input id="tx-to" type="date" onchange="filterTransactions()" class="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none" title="To date">
      <button class="ghost-btn" onclick="exportTransactionsCSV()"><i data-lucide="file-spreadsheet"></i>Download Statement</button>
      <button class="ghost-btn" onclick="document.getElementById('tx-search').value='';document.getElementById('tx-type').value='ALL';document.getElementById('tx-from').value='';document.getElementById('tx-to').value='';filterTransactions()"><i data-lucide="rotate-ccw"></i>Reset</button>
    </div>
    <div class="table-wrap"><table class="data-table"><thead><tr><th>Reference</th><th>Account</th><th>Type</th><th>Amount</th><th>Balance</th><th>Date</th><th>Actions</th></tr></thead><tbody id="tx-body">${renderRows(state.data.transactions)}</tbody></table></div>
  </div>`;
  state._transactionRowsRenderer=renderRows;
  lucide.createIcons();
}
function filterTransactions(){
  const q=(document.getElementById('tx-search')?.value||'').toLowerCase().trim();
  const type=document.getElementById('tx-type')?.value||'ALL';
  const rows=(state.data.transactions||[]).filter(x=>{
    const hay=[x.transactionReference,x.savingAccountId,x.description,x.type,x.amount,x.balanceAfterTransaction].join(' ').toLowerCase();
    const d=x.transactionDate?new Date(x.transactionDate):null;
    const from=document.getElementById('tx-from')?.value;
    const to=document.getElementById('tx-to')?.value;
    const fromOk=!from||!d||d>=new Date(from+'T00:00:00');
    const toOk=!to||!d||d<=new Date(to+'T23:59:59');
    return (!q||hay.includes(q))&&(type==='ALL'||x.type===type)&&fromOk&&toOk;
  });
  const body=document.getElementById('tx-body');
  if(body)body.innerHTML=state._transactionRowsRenderer(rows);
  lucide.createIcons();
}
async function downloadTransactionFromTable(id){
  try{
    const tx=await apiFetch(`/transactions/${id}`);
    let account={};
    try{account=await apiFetch(`/savings/${tx.savingAccountId}`)||{};}catch(e){}
    state._paymentSlipTx={...tx,accountNumber:account.accountNumber||'—',accountHolder:account.accountHolderName||'Account Holder',typeLabel:tx.type==='DEPOSIT'?'Money Credited':'Money Debited'};
    await downloadPaymentSlipImage();
  }catch(err){toast(err.message||'Unable to download payment slip','error');}
}
function getFilteredTransactions(){
  const q=(document.getElementById('tx-search')?.value||'').toLowerCase().trim();
  const type=document.getElementById('tx-type')?.value||'ALL';
  const from=document.getElementById('tx-from')?.value; const to=document.getElementById('tx-to')?.value;
  return (state.data.transactions||[]).filter(x=>{
    const hay=[x.transactionReference,x.savingAccountId,x.description,x.type,x.amount,x.balanceAfterTransaction].join(' ').toLowerCase();
    const d=x.transactionDate?new Date(x.transactionDate):null;
    return (!q||hay.includes(q))&&(type==='ALL'||x.type===type)&&(!from||!d||d>=new Date(from+'T00:00:00'))&&(!to||!d||d<=new Date(to+'T23:59:59'));
  });
}
function exportTransactionsCSV(){
  const rows=getFilteredTransactions();
  if(!rows.length){toast('No transactions to download','info');return;}
  const header=['Reference','Account ID','Type','Amount','Balance After','Transaction Date','Description'];
  const escCsv=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
  const csv=[header,...rows.map(x=>[x.transactionReference,x.savingAccountId,x.type,x.amount,x.balanceAfterTransaction,x.transactionDate,x.description])].map(r=>r.map(escCsv).join(',')).join('\r\n');
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='Finora-Transaction-Statement.csv'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000); toast('Transaction statement downloaded');
}
async function shareTransactionFromTable(id){
  try{
    // Load the same transaction data used by the payment slip.
    const tx=await apiFetch(`/transactions/${id}`);
    let account={};
    try{account=await apiFetch(`/savings/${tx.savingAccountId}`)||{};}catch(e){}
    state._paymentSlipTx={
      ...tx,
      accountNumber:account.accountNumber||'—',
      accountHolder:account.accountHolderName||'Account Holder',
      typeLabel:tx.type==='DEPOSIT'?'Money Credited':'Money Debited'
    };
    await sharePaymentSlip();
  }catch(err){toast(err.message||'Unable to share payment slip','error');}
}
async function viewTransaction(id){
  try{
    const tx=await apiFetch(`/transactions/${id}`);
    let account=null;
    try{account=await apiFetch(`/savings/${tx.savingAccountId}`);}catch{}
    const holder=account?.accountHolderName||account?.userName||'Account Holder';
    const accountNo=account?.accountNumber||'—';
    const typeLabel=tx.type==='DEPOSIT'?'Deposit':'Withdrawal';
    state._paymentSlipTx={...tx, accountHolder:holder, accountNumber:accountNo, typeLabel};
    modal('Payment Slip',`<div id="payment-slip" class="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="flex items-start justify-between border-b border-dashed border-slate-200 pb-5"><div><div class="flex items-center gap-2"><div class="mini-icon"><i data-lucide="landmark"></i></div><div><h3 class="font-bold">Finora Finance</h3><p class="text-xs text-slate-400">Transaction Receipt</p></div></div></div><div class="text-right">${status('SUCCESS')}<p class="mt-2 text-xs text-slate-400">${date(tx.transactionDate)}</p></div></div>
      <div class="py-5 text-center"><p class="text-xs font-semibold uppercase tracking-widest text-slate-400">${typeLabel} Amount</p><p class="mt-2 text-3xl font-bold">${money(tx.amount)}</p><p class="mt-1 text-xs text-slate-400">${esc(tx.transactionReference||'—')}</p></div>
      <div class="grid gap-3 sm:grid-cols-2">
        <div class="rounded-2xl bg-slate-50 p-4"><p class="text-xs text-slate-400">Account Holder</p><p class="mt-1 font-semibold">${esc(holder)}</p></div>
        <div class="rounded-2xl bg-slate-50 p-4"><p class="text-xs text-slate-400">Account Number</p><p class="mt-1 font-semibold">${esc(accountNo)}</p></div>
        <div class="rounded-2xl bg-slate-50 p-4"><p class="text-xs text-slate-400">Transaction Type</p><p class="mt-1 font-semibold">${esc(typeLabel)}</p></div>
        <div class="rounded-2xl bg-slate-50 p-4"><p class="text-xs text-slate-400">Balance After</p><p class="mt-1 font-semibold">${money(tx.balanceAfterTransaction)}</p></div>
      </div>
      <div class="mt-3 rounded-2xl bg-slate-50 p-4"><p class="text-xs text-slate-400">Description</p><p class="mt-1 font-semibold">${esc(tx.description||'No description')}</p></div>
      <div class="mt-5 flex items-center justify-between border-t border-dashed border-slate-200 pt-4"><span class="text-xs text-slate-400">Transaction ID: ${esc(tx.id)}</span><span class="text-xs font-medium text-emerald-600">Payment Successful</span></div>
    </div><div class="mt-5 flex flex-wrap justify-end gap-2"><button class="ghost-btn" onclick="closeModal()">Close</button><button class="ghost-btn" onclick="copyTransactionReference()"><i data-lucide="copy"></i>Copy Reference</button><button class="ghost-btn" onclick="downloadPaymentSlipImage()"><i data-lucide="image-down"></i>Save Image</button><button class="primary-btn" onclick="printPaymentSlip()"><i data-lucide="printer"></i>Print / PDF</button></div>`);
    lucide.createIcons();
  }catch(err){toast(err.message,'error');}
}
function paymentSlipData(){
  const tx=state._paymentSlipTx||{};
  return {reference:String(tx.transactionReference||'—'),account:String(tx.accountNumber||'—'),holder:String(tx.accountHolder||'Account Holder'),type:String(tx.typeLabel||tx.type||'Transaction'),amount:Number(tx.amount||0),balance:Number(tx.balanceAfterTransaction||0),dateText:date(tx.transactionDate),description:String(tx.description||'No description'),id:String(tx.id||'—')};
}
function drawReceiptCanvas(){
  const d=paymentSlipData(),canvas=document.createElement('canvas');canvas.width=1200;canvas.height=1500;const ctx=canvas.getContext('2d');
  ctx.fillStyle='#f8fafc';ctx.fillRect(0,0,1200,1500);ctx.fillStyle='#fff';ctx.fillRect(90,70,1020,1360);ctx.strokeStyle='#e2e8f0';ctx.lineWidth=2;ctx.strokeRect(90,70,1020,1360);
  ctx.fillStyle='#0f172a';ctx.font='700 42px Arial';ctx.fillText('FINORA FINANCE',140,145);ctx.fillStyle='#64748b';ctx.font='22px Arial';ctx.fillText('Transaction Receipt',140,182);ctx.fillStyle='#059669';ctx.font='700 24px Arial';ctx.fillText('PAYMENT SUCCESSFUL',850,150);ctx.fillStyle='#64748b';ctx.font='20px Arial';ctx.fillText(d.dateText,850,182);
  ctx.setLineDash([8,8]);ctx.strokeStyle='#cbd5e1';ctx.beginPath();ctx.moveTo(140,220);ctx.lineTo(1060,220);ctx.stroke();ctx.setLineDash([]);ctx.textAlign='center';ctx.fillStyle='#64748b';ctx.font='700 18px Arial';ctx.fillText((d.type+' AMOUNT').toUpperCase(),600,275);ctx.fillStyle='#0f172a';ctx.font='700 58px Arial';ctx.fillText(formatMoneyPlain(d.amount),600,345);ctx.fillStyle='#64748b';ctx.font='20px Arial';ctx.fillText(d.reference,600,385);ctx.textAlign='left';
  const boxes=[['Account Holder',d.holder],['Account Number',d.account],['Transaction Type',d.type],['Balance After',formatMoneyPlain(d.balance)],['Transaction ID',d.id],['Date',d.dateText]];
  boxes.forEach((b,i)=>{const col=i%2,row=Math.floor(i/2),x=140+col*470,y=440+row*130;ctx.fillStyle='#f8fafc';roundRect(ctx,x,y,430,105,18);ctx.fillStyle='#64748b';ctx.font='18px Arial';ctx.fillText(b[0],x+22,y+34);ctx.fillStyle='#0f172a';ctx.font='700 22px Arial';ctx.fillText(truncateCanvas(b[1],31),x+22,y+70);});
  ctx.fillStyle='#f8fafc';roundRect(ctx,140,850,900,130,18);ctx.fillStyle='#64748b';ctx.font='18px Arial';ctx.fillText('Description',165,890);ctx.fillStyle='#0f172a';ctx.font='700 21px Arial';wrapCanvasText(ctx,d.description,165,930,850,30);ctx.fillStyle='#0f172a';ctx.font='700 22px Arial';ctx.fillText('Thank you for using Finora Finance.',140,1060);ctx.fillStyle='#64748b';ctx.font='18px Arial';ctx.fillText('This is a system-generated transaction receipt.',140,1095);ctx.setLineDash([8,8]);ctx.strokeStyle='#cbd5e1';ctx.beginPath();ctx.moveTo(140,1150);ctx.lineTo(1060,1150);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#64748b';ctx.font='16px Arial';ctx.fillText('Keep this receipt for your records.',140,1200);return canvas;
}
function roundRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();ctx.fill();}
function formatMoneyPlain(v){return '₹'+Number(v||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});}
function truncateCanvas(v,n){v=String(v);return v.length>n?v.slice(0,n-1)+'…':v;}
function wrapCanvasText(ctx,text,x,y,maxWidth,lineHeight){let words=String(text).split(' '),line='';for(const word of words){const test=line?line+' '+word:word;if(ctx.measureText(test).width>maxWidth&&line){ctx.fillText(line,x,y);line=word;y+=lineHeight;}else line=test;}if(line)ctx.fillText(line,x,y);}
function canvasBlob(canvas){return new Promise(resolve=>canvas.toBlob(resolve,'image/png',1));}
async function downloadPaymentSlipImage(){try{const blob=await canvasBlob(drawReceiptCanvas());const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Finora-Payment-Slip-'+paymentSlipData().reference+'.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Payment slip image saved');}catch(e){toast('Unable to create payment slip image','error');}}
async function sharePaymentSlip(){try{const d=paymentSlipData(),blob=await canvasBlob(drawReceiptCanvas()),file=new File([blob],`Finora-Payment-Slip-${d.reference}.png`,{type:'image/png'});if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){await navigator.share({title:'Finora Finance - Payment Slip',text:`${d.type} of ${formatMoneyPlain(d.amount)} | Ref: ${d.reference}`,files:[file]});toast('Payment slip image shared successfully');}else{await downloadPaymentSlipImage();toast('Image sharing is not supported here. The slip image was saved; attach it to WhatsApp or email.','info');}}catch(err){if(err?.name!=='AbortError')toast('Unable to share image. Use Save Image or Print / PDF.','error');}}
async function copyTransactionReference(){const ref=paymentSlipData().reference;try{await navigator.clipboard.writeText(ref);toast('Transaction reference copied');}catch{prompt('Copy transaction reference:',ref);}}
function printPaymentSlip(){
  const slip=document.getElementById('payment-slip');
  if(!slip)return;
  const w=window.open('','_blank','width=800,height=900');
  w.document.write(`<html><head><title>Payment Slip</title><style>body{font-family:Arial,sans-serif;padding:40px;color:#1e293b} .receipt{max-width:600px;margin:auto;border:1px solid #e2e8f0;border-radius:18px;padding:28px} .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.box{background:#f8fafc;padding:14px;border-radius:12px}.muted{color:#64748b;font-size:12px}.amount{text-align:center;font-size:32px;font-weight:700;margin:25px 0}.ok{color:#059669;font-weight:700}</style></head><body><div class="receipt">${slip.innerHTML}</div><script>window.onload=()=>window.print()<\/script></body></html>`);w.document.close();
}
async function fdPage(c){
  const rows=await apiFetch('/fd');
  state.data.fd=Array.isArray(rows)?rows:[];
  let users=Array.isArray(state.data.users)?state.data.users:[];
  if(!users.length){try{users=await apiFetch('/users');state.data.users=Array.isArray(users)?users:[];}catch(e){users=[];}}
  const userMap=new Map(users.map(u=>[String(u.id),u]));
  const active=rows.filter(x=>String(x.status||'').toUpperCase()==='ACTIVE');
  const matured=rows.filter(x=>String(x.status||'').toUpperCase()==='MATURED');
  const invested=rows.reduce((a,x)=>a+Number(x.depositAmount||0),0);
  const maturity=rows.reduce((a,x)=>a+Number(x.maturityAmount||0),0);
  const soon=active.filter(x=>fdDaysRemaining(x.maturityDate)>=0&&fdDaysRemaining(x.maturityDate)<=30);
  const cards=`<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-5">
    <div class="stat-card"><div class="flex items-center justify-between"><div class="mini-icon"><i data-lucide="landmark"></i></div><span class="text-xs font-semibold text-emerald-700">Active</span></div><p class="mt-5 text-xs font-semibold uppercase tracking-widest text-slate-400">Total Active FD</p><p class="mt-1 text-2xl font-bold">${active.length}</p><p class="mt-1 text-xs text-slate-500">Currently running deposits</p></div>
    <div class="stat-card"><div class="flex items-center justify-between"><div class="mini-icon"><i data-lucide="wallet"></i></div></div><p class="mt-5 text-xs font-semibold uppercase tracking-widest text-slate-400">Total Invested</p><p class="mt-1 text-2xl font-bold">${money(invested)}</p><p class="mt-1 text-xs text-slate-500">Across ${rows.length} FD record(s)</p></div>
    <div class="stat-card"><div class="flex items-center justify-between"><div class="mini-icon"><i data-lucide="trending-up"></i></div></div><p class="mt-5 text-xs font-semibold uppercase tracking-widest text-slate-400">Total Maturity Value</p><p class="mt-1 text-2xl font-bold">${money(maturity)}</p><p class="mt-1 text-xs text-slate-500">Principal + interest</p></div>
    <div class="stat-card"><div class="flex items-center justify-between"><div class="mini-icon"><i data-lucide="badge-check"></i></div></div><p class="mt-5 text-xs font-semibold uppercase tracking-widest text-slate-400">Matured FD</p><p class="mt-1 text-2xl font-bold">${matured.length}</p><p class="mt-1 text-xs text-slate-500">Completed maturity records</p></div>
  </div>
  ${soon.length?`<div class="fd-alert mb-5"><div class="mini-icon"><i data-lucide="bell-ring"></i></div><div><p class="font-semibold text-slate-800">${soon.length} FD${soon.length>1?'s are':' is'} maturing soon</p><p class="text-xs text-slate-500 mt-1">${soon.slice(0,3).map(x=>`${esc(x.fdNumber||'FD')} · ${fdDaysRemaining(x.maturityDate)} day${fdDaysRemaining(x.maturityDate)===1?'':'s'} remaining`).join(' &nbsp; • &nbsp; ')}</p></div></div>`:''}`;
  c.innerHTML=`<div class="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div class="flex items-center gap-3"><div class="mini-icon"><i data-lucide="landmark"></i></div><div><h2 class="text-2xl font-bold">Fixed Deposits</h2><p class="mt-1 text-sm text-slate-500">Create, monitor and manage fixed-term investments</p></div></div></div><button class="primary-btn" onclick="openGenericForm('fd')"><i data-lucide="plus"></i>Create FD</button></div>${cards}<div class="data-card">${fdToolbar(rows)}<div class="table-wrap"><table id="fd-table" class="data-table"><thead><tr><th>FD Number</th><th>Customer</th><th>Deposit</th><th>Rate</th><th>Maturity</th><th>Maturity Date</th><th>Status</th><th>Actions</th></tr></thead><tbody id="fd-table-body"></tbody></table></div><div id="fd-pagination" class="fd-pagination"></div></div>`;
  state.data.fdUsers=userMap;
  fdRenderTable();
  lucide.createIcons();
}
function fdToolbar(rows){return `<div class="fd-toolbar"><div><p class="text-sm font-semibold"><span id="fd-visible-count">${rows.length}</span> FD record(s)</p><p class="text-xs text-slate-400 mt-1">Search, filter and sort your fixed deposits.</p></div><div class="fd-controls"><input id="fd-search" class="fd-search" placeholder="Search FD number or User ID..." oninput="fdRenderTable()"><select id="fd-status" class="toolbar-select" onchange="fdRenderTable()"><option value="ALL">All status</option><option value="ACTIVE">Active</option><option value="MATURED">Matured</option><option value="CLOSED">Closed</option></select><select id="fd-sort" class="toolbar-select" onchange="fdRenderTable()"><option value="NEWEST">Newest FD</option><option value="OLDEST">Oldest FD</option><option value="DEPOSIT_HIGH">Highest Deposit</option><option value="MATURITY_HIGH">Highest Maturity</option></select><select id="fd-page-size" class="toolbar-select" onchange="fdRenderTable()"><option value="10">10 records</option><option value="20">20 records</option><option value="50">50 records</option></select><button class="ghost-btn" onclick="refreshCurrent()"><i data-lucide="refresh-cw"></i>Refresh</button></div></div>`;}
function fdDaysRemaining(v){if(!v)return null;const d=new Date(v);if(Number.isNaN(d.getTime()))return null;return Math.ceil((new Date(d.getFullYear(),d.getMonth(),d.getDate())-new Date(new Date().getFullYear(),new Date().getMonth(),new Date().getDate()))/86400000);}
function fdCustomer(x){const u=state.data.fdUsers?.get(String(x.userId));return u?.name||`User #${x.userId??'—'}`;}
function fdRenderTable(){const all=Array.isArray(state.data.fd)?state.data.fd:[];const q=(document.getElementById('fd-search')?.value||'').toLowerCase().trim();const st=document.getElementById('fd-status')?.value||'ALL';const sort=document.getElementById('fd-sort')?.value||'NEWEST';const size=Number(document.getElementById('fd-page-size')?.value||10);let rows=all.filter(x=>{const hay=`${x.fdNumber||''} ${x.userId||''} ${fdCustomer(x)}`.toLowerCase();return (!q||hay.includes(q))&&(st==='ALL'||String(x.status||'').toUpperCase()===st);});rows.sort((a,b)=>{if(sort==='DEPOSIT_HIGH')return Number(b.depositAmount||0)-Number(a.depositAmount||0);if(sort==='MATURITY_HIGH')return Number(b.maturityAmount||0)-Number(a.maturityAmount||0);const ad=new Date(a.startDate||a.createdAt||0),bd=new Date(b.startDate||b.createdAt||0);return sort==='OLDEST'?ad-bd:bd-ad;});const pages=Math.max(1,Math.ceil(rows.length/size));state.data.fdPage=Math.min(state.data.fdPage||1,pages);const page=state.data.fdPage||1;const slice=rows.slice((page-1)*size,page*size);const body=document.getElementById('fd-table-body');if(body)body.innerHTML=slice.length?slice.map(x=>{const days=fdDaysRemaining(x.maturityDate);const maturityLabel=days===null?'—':days<0?`<span class="text-rose-600 font-semibold">Matured</span>`:`<span class="text-slate-600">${days} day${days===1?'':'s'} left</span>`;return `<tr><td class="font-semibold">${esc(x.fdNumber||'—')}</td><td><div class="font-semibold">${esc(fdCustomer(x))}</div><div class="text-xs text-slate-400">User #${esc(x.userId??'—')}</div></td><td class="font-semibold">${money(x.depositAmount)}</td><td>${esc(x.interestRate??'—')}%</td><td><div class="font-semibold">${money(x.maturityAmount)}</div><div class="text-xs text-slate-400">${maturityLabel}</div></td><td>${date(x.maturityDate)}</td><td>${status(x.status)}</td><td><div class="action-row"><button class="action-btn" onclick="viewFD(${x.id})"><i data-lucide="eye"></i>View</button><button class="action-btn" onclick="showFDCertificate(${x.id})"><i data-lucide="file-badge"></i>Certificate</button><button class="action-btn" onclick='openGenericForm("fd",${JSON.stringify(x)})'><i data-lucide="pencil"></i>Edit</button></div></td></tr>`;}).join(''):`<tr><td colspan="8"><div class="empty"><i data-lucide="landmark"></i><p>No fixed deposits found.</p></div></td></tr>`;const count=document.getElementById('fd-visible-count');if(count)count.textContent=rows.length;const pg=document.getElementById('fd-pagination');if(pg)pg.innerHTML=`<div class="text-xs text-slate-500">Showing ${rows.length?((page-1)*size+1):0}–${Math.min(page*size,rows.length)} of ${rows.length}</div><div class="flex gap-2"><button class="ghost-btn" ${page<=1?'disabled':''} onclick="state.data.fdPage=${page-1};fdRenderTable()"><i data-lucide="chevron-left"></i>Previous</button><span class="fd-page-number">Page ${page} of ${pages}</span><button class="ghost-btn" ${page>=pages?'disabled':''} onclick="state.data.fdPage=${page+1};fdRenderTable()">Next<i data-lucide="chevron-right"></i></button></div>`;lucide.createIcons();}
function fdById(id){return (state.data.fd||[]).find(x=>String(x.id)===String(id));}
function viewFD(id){const x=fdById(id);if(!x)return;const days=fdDaysRemaining(x.maturityDate);modal(`FD Details · ${esc(x.fdNumber||'Fixed Deposit')}`,`<div class="fd-detail-head"><div class="mini-icon"><i data-lucide="landmark"></i></div><div><p class="text-xs uppercase tracking-widest text-slate-400">Fixed Deposit</p><h3 class="font-bold text-lg">${esc(x.fdNumber||'—')}</h3></div><div class="ml-auto">${status(x.status)}</div></div><div class="fd-detail-grid">${[['Customer',fdCustomer(x)],['FD Number',x.fdNumber||'—'],['Deposit Amount',money(x.depositAmount)],['Interest Rate',`${x.interestRate??'—'}%`],['Tenure',`${x.tenureMonths??'—'} months`],['Start Date',date(x.startDate)],['Maturity Date',date(x.maturityDate)],['Interest Earned',money(Number(x.maturityAmount||0)-Number(x.depositAmount||0))],['Maturity Amount',money(x.maturityAmount)],['Maturity Tracking',days===null?'—':days<0?'Matured':`${days} day${days===1?'':'s'} remaining`]].map(a=>`<div class="fd-detail-box"><span>${esc(a[0])}</span><strong>${esc(a[1])}</strong></div>`).join('')}</div><div class="flex justify-end gap-2 mt-5"><button class="ghost-btn" onclick="closeModal()">Close</button><button class="primary-btn" onclick="showFDCertificate(${x.id})"><i data-lucide="file-badge"></i>View Certificate</button></div>`);}
function fdCertificateData(x){return {number:x.fdNumber||'—',customer:fdCustomer(x),principal:money(x.depositAmount),rate:`${x.interestRate??'—'}%`,tenure:`${x.tenureMonths??'—'} months`,start:date(x.startDate),maturity:date(x.maturityDate),interest:money(Number(x.maturityAmount||0)-Number(x.depositAmount||0)),amount:money(x.maturityAmount),status:String(x.status||'ACTIVE').toUpperCase()};}
function showFDCertificate(id){const x=fdById(id);if(!x)return;const d=fdCertificateData(x);modal('Fixed Deposit Certificate',`<div id="fd-certificate" class="fd-certificate"><div class="fd-cert-top"><div><p class="eyebrow">Finora Finance</p><h2>Fixed Deposit Certificate</h2></div><div class="fd-cert-icon"><i data-lucide="landmark"></i></div></div><div class="fd-cert-status">${status(d.status)}</div><div class="fd-cert-amount"><span>Maturity Amount</span><strong>${d.amount}</strong></div><div class="fd-cert-grid">${[['Customer Name',d.customer],['FD Number',d.number],['Principal Amount',d.principal],['Interest Rate',d.rate],['Tenure',d.tenure],['Start Date',d.start],['Maturity Date',d.maturity],['Interest Earned',d.interest]].map(a=>`<div><span>${esc(a[0])}</span><strong>${esc(a[1])}</strong></div>`).join('')}</div><div class="fd-cert-note">This is a system-generated fixed deposit certificate. Please keep it for your records.</div></div><div class="flex flex-wrap justify-end gap-2 mt-4"><button class="ghost-btn" onclick="closeModal()">Close</button><button class="ghost-btn" onclick="downloadFDCertificate(${id})"><i data-lucide="download"></i>Download</button><button class="ghost-btn" onclick="shareFDCertificate(${id})"><i data-lucide="share-2"></i>Share</button><button class="primary-btn" onclick="printFDCertificate()"><i data-lucide="printer"></i>Print</button></div>`);}
function fdCanvas(){const el=document.getElementById('fd-certificate');if(!el)return null;const c=document.createElement('canvas');c.width=1200;c.height=900;const ctx=c.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,c.width,c.height);ctx.strokeStyle='#dbe3ea';ctx.lineWidth=3;ctx.strokeRect(40,40,1120,820);ctx.fillStyle='#257566';ctx.font='700 34px Arial';ctx.fillText('FINORA FINANCE',90,110);ctx.fillStyle='#0f172a';ctx.font='700 30px Arial';ctx.fillText('Fixed Deposit Certificate',90,160);ctx.fillStyle='#f0f8f6';ctx.fillRect(90,200,1020,120);ctx.fillStyle='#64748b';ctx.font='18px Arial';ctx.fillText('Maturity Amount',120,240);ctx.fillStyle='#0f172a';ctx.font='700 40px Arial';ctx.fillText(el.querySelector('.fd-cert-amount strong')?.textContent||'—',120,290);ctx.font='18px Arial';ctx.fillStyle='#64748b';ctx.fillText('Status: '+(el.querySelector('.fd-cert-status')?.innerText||'ACTIVE').trim(),820,270);const cells=[...el.querySelectorAll('.fd-cert-grid>div')];cells.forEach((cell,i)=>{const col=i%2,row=Math.floor(i/2),xx=90+col*520,yy=370+row*92;ctx.fillStyle='#f8fafc';ctx.fillRect(xx,yy,490,68);ctx.fillStyle='#64748b';ctx.font='15px Arial';ctx.fillText(cell.querySelector('span')?.textContent||'',xx+18,yy+25);ctx.fillStyle='#0f172a';ctx.font='700 19px Arial';ctx.fillText(String(cell.querySelector('strong')?.textContent||'').slice(0,42),xx+18,yy+51);});ctx.fillStyle='#64748b';ctx.font='15px Arial';ctx.fillText('System-generated certificate · Finora Finance',90,820);return c;}
async function downloadFDCertificate(id){if(!document.getElementById('fd-certificate'))showFDCertificate(id);setTimeout(async()=>{const blob=await new Promise(r=>fdCanvas()?.toBlob(r,'image/png',1));if(!blob)return;const x=fdById(id),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=`Finora-FD-Certificate-${x?.fdNumber||id}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);toast('FD certificate downloaded');},50);}
async function shareFDCertificate(id){if(!document.getElementById('fd-certificate'))showFDCertificate(id);setTimeout(async()=>{const blob=await new Promise(r=>fdCanvas()?.toBlob(r,'image/png',1));if(!blob)return;const x=fdById(id),file=new File([blob],`Finora-FD-Certificate-${x?.fdNumber||id}.png`,{type:'image/png'});try{if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){await navigator.share({title:'Finora Finance - FD Certificate',text:`Fixed Deposit Certificate | ${x?.fdNumber||''}`,files:[file]});toast('FD certificate shared successfully');}else{await downloadFDCertificate(id);toast('Sharing is not supported here. Certificate image was saved.','info');}}catch(e){if(e?.name!=='AbortError')toast('Unable to share certificate','error');}},50);}
function printFDCertificate(){const slip=document.getElementById('fd-certificate');if(!slip)return;const w=window.open('','_blank','width=850,height=900');w.document.write(`<html><head><title>Fixed Deposit Certificate</title><style>body{font-family:Arial,sans-serif;padding:40px;color:#1e293b}.receipt{max-width:760px;margin:auto;border:1px solid #dbe3ea;border-radius:18px;padding:32px}.top{display:flex;justify-content:space-between}.amount{background:#f0f8f6;padding:24px;margin:25px 0;border-radius:14px;font-size:28px;font-weight:700}.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.box{background:#f8fafc;padding:14px;border-radius:10px}.muted{color:#64748b;font-size:12px}</style></head><body><div class="receipt">${slip.innerHTML}</div><script>window.onload=()=>window.print()<\/script></body></html>`);w.document.close();}
async function rdPage(c){
  const rows=await apiFetch('/rd');
  state.data.rd=Array.isArray(rows)?rows:[];
  let users=Array.isArray(state.data.users)?state.data.users:[];
  if(!users.length){try{users=await apiFetch('/users');state.data.users=Array.isArray(users)?users:[];}catch(e){users=[];}}
  state.data.rdUsers=new Map(users.map(u=>[String(u.id),u]));
  state.data.rdPage=1;
  c.innerHTML=`<div class="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div class="flex items-center gap-3"><div class="mini-icon"><i data-lucide="repeat-2"></i></div><div><h2 class="text-2xl font-bold">Recurring Deposits</h2><p class="mt-1 text-sm text-slate-500">Build savings through scheduled monthly installments</p></div></div></div><button class="primary-btn" onclick="openGenericForm('rd')"><i data-lucide="plus"></i>Create RD</button></div>${rdDashboardCards()}<div id="rd-maturity-alert"></div><div class="data-card"><div class="rd-toolbar"><div><p class="text-sm font-semibold"><span id="rd-visible-count">${state.data.rd.length}</span> RD record(s)</p><p class="text-xs text-slate-400 mt-1">Track installments, maturity and recurring savings.</p></div><div class="rd-controls"><input id="rd-search" class="rd-search" placeholder="Search RD number, User ID or customer..." oninput="rdRenderTable()"><select id="rd-status" class="toolbar-select" onchange="rdRenderTable()"><option value="ALL">All status</option><option value="ACTIVE">Active</option><option value="COMPLETED">Completed</option><option value="CLOSED">Closed</option></select><select id="rd-sort" class="toolbar-select" onchange="rdRenderTable()"><option value="NEWEST">Newest RD</option><option value="OLDEST">Oldest RD</option><option value="INSTALLMENT_HIGH">Highest Monthly Installment</option><option value="DEPOSIT_HIGH">Highest Total Deposited</option><option value="MATURITY_HIGH">Highest Maturity</option><option value="MATURITY_NEAR">Nearest Maturity</option></select><select id="rd-page-size" class="toolbar-select" onchange="state.data.rdPage=1;rdRenderTable()"><option value="10">10 records</option><option value="20">20 records</option><option value="50">50 records</option></select><button class="ghost-btn" onclick="exportRDCSV()"><i data-lucide="file-spreadsheet"></i>Download Statement</button><button class="ghost-btn" onclick="refreshCurrent()"><i data-lucide="refresh-cw"></i>Refresh</button></div></div><div class="table-wrap"><table id="rd-table" class="data-table"><thead><tr><th>RD Number</th><th>Customer</th><th>Monthly</th><th>Installments</th><th>Maturity</th><th>Maturity Date</th><th>Status</th><th>Actions</th></tr></thead><tbody id="rd-table-body"></tbody></table></div><div id="rd-pagination" class="rd-pagination"></div></div>`;
  rdRenderTable();
  lucide.createIcons();
}
function rdCustomer(x){const u=state.data.rdUsers?.get(String(x.userId));return u?.name||`User #${x.userId??'—'}`;}
function rdDaysRemaining(v){if(!v)return null;const d=new Date(v);if(Number.isNaN(d.getTime()))return null;const target=new Date(d.getFullYear(),d.getMonth(),d.getDate());const today=new Date();const base=new Date(today.getFullYear(),today.getMonth(),today.getDate());return Math.ceil((target-base)/86400000);}
function rdProgress(x){const total=Math.max(Number(x.tenureMonths||0),0),paid=Math.min(Math.max(Number(x.installmentsPaid||0),0),total||Number(x.installmentsPaid||0));return {total,paid,remaining:Math.max(total-paid,0),percent:total?Math.min(100,Math.round((paid/total)*100)):0};}
function rdDashboardCards(){const rows=Array.isArray(state.data.rd)?state.data.rd:[],active=rows.filter(x=>String(x.status||'').toUpperCase()==='ACTIVE'),invested=rows.reduce((a,x)=>a+Number(x.totalDeposited||0),0),monthly=active.reduce((a,x)=>a+Number(x.monthlyInstallment||0),0),maturity=rows.reduce((a,x)=>a+Number(x.maturityAmount||0),0),matured=rows.filter(x=>String(x.status||'').toUpperCase()==='COMPLETED'||String(x.status||'').toUpperCase()==='MATURED').length;return `<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-5"><div class="stat-card"><div class="flex items-center justify-between"><div class="mini-icon"><i data-lucide="repeat-2"></i></div><span class="text-xs font-semibold text-emerald-700">Active</span></div><p class="mt-5 text-xs font-semibold uppercase tracking-widest text-slate-400">Active RD</p><p class="mt-1 text-2xl font-bold">${active.length}</p><p class="mt-1 text-xs text-slate-500">Currently running deposits</p></div><div class="stat-card"><div class="mini-icon"><i data-lucide="calendar-plus"></i></div><p class="mt-5 text-xs font-semibold uppercase tracking-widest text-slate-400">Total Monthly Commitment</p><p class="mt-1 text-2xl font-bold">${money(monthly)}</p><p class="mt-1 text-xs text-slate-500">Active monthly installments</p></div><div class="stat-card"><div class="mini-icon"><i data-lucide="wallet"></i></div><p class="mt-5 text-xs font-semibold uppercase tracking-widest text-slate-400">Total Deposited</p><p class="mt-1 text-2xl font-bold">${money(invested)}</p><p class="mt-1 text-xs text-slate-500">Across ${rows.length} RD record(s)</p></div><div class="stat-card"><div class="mini-icon"><i data-lucide="trending-up"></i></div><p class="mt-5 text-xs font-semibold uppercase tracking-widest text-slate-400">Total Maturity Value</p><p class="mt-1 text-2xl font-bold">${money(maturity)}</p><p class="mt-1 text-xs text-slate-500">${matured} completed/matured record(s)</p></div></div>`;}
function rdRenderTable(){const all=Array.isArray(state.data.rd)?state.data.rd:[],q=(document.getElementById('rd-search')?.value||'').toLowerCase().trim(),st=document.getElementById('rd-status')?.value||'ALL',sort=document.getElementById('rd-sort')?.value||'NEWEST',size=Number(document.getElementById('rd-page-size')?.value||10);let rows=all.filter(x=>{const hay=`${x.rdNumber||''} ${x.userId||''} ${rdCustomer(x)}`.toLowerCase();return (!q||hay.includes(q))&&(st==='ALL'||String(x.status||'').toUpperCase()===st);});rows.sort((a,b)=>{if(sort==='INSTALLMENT_HIGH')return Number(b.monthlyInstallment||0)-Number(a.monthlyInstallment||0);if(sort==='DEPOSIT_HIGH')return Number(b.totalDeposited||0)-Number(a.totalDeposited||0);if(sort==='MATURITY_HIGH')return Number(b.maturityAmount||0)-Number(a.maturityAmount||0);if(sort==='MATURITY_NEAR'){const ad=rdDaysRemaining(a.maturityDate),bd=rdDaysRemaining(b.maturityDate);return (ad===null?999999:Math.abs(ad))-(bd===null?999999:Math.abs(bd));}const ad=new Date(a.startDate||a.createdAt||0),bd=new Date(b.startDate||b.createdAt||0);return sort==='OLDEST'?ad-bd:bd-ad;});const pages=Math.max(1,Math.ceil(rows.length/size));state.data.rdPage=Math.min(Math.max(state.data.rdPage||1,1),pages);const page=state.data.rdPage,slice=rows.slice((page-1)*size,page*size),body=document.getElementById('rd-table-body');if(body)body.innerHTML=slice.length?slice.map(x=>{const p=rdProgress(x),days=rdDaysRemaining(x.maturityDate),maturityLabel=days===null?'—':days<0?'<span class="text-rose-600 font-semibold">Matured</span>':`<span class="text-slate-500">${days} day${days===1?'':'s'} left</span>`;return `<tr><td class="font-semibold">${esc(x.rdNumber||'—')}</td><td><div class="font-semibold">${esc(rdCustomer(x))}</div><div class="text-xs text-slate-400">User #${esc(x.userId??'—')}</div></td><td class="font-semibold">${money(x.monthlyInstallment)}</td><td><div class="rd-progress-wrap"><div class="flex items-center justify-between gap-3 text-xs"><span class="font-semibold">${p.paid} / ${p.total||'—'}</span><span class="text-slate-400">${p.percent}%</span></div><div class="rd-progress"><span style="width:${p.percent}%"></span></div><div class="text-xs text-slate-400 mt-1">${p.remaining} remaining</div></div></td><td><div class="font-semibold">${money(x.maturityAmount)}</div><div class="text-xs text-slate-400">${maturityLabel}</div></td><td>${date(x.maturityDate)}</td><td>${status(x.status)}</td><td><div class="action-row"><button class="action-btn" onclick="viewRD(${x.id})"><i data-lucide="eye"></i>View</button>${String(x.status||'').toUpperCase()==='ACTIVE'&&p.remaining>0?`<button class="action-btn" onclick="openRDInstallment(${x.id})"><i data-lucide="circle-dollar-sign"></i>Pay</button>`:''}<button class="action-btn" onclick="showRDCertificate(${x.id})"><i data-lucide="file-badge"></i>Certificate</button><button class="action-btn" onclick='openGenericForm("rd",${JSON.stringify(x)})'><i data-lucide="pencil"></i>Edit</button></div></td></tr>`;}).join(''):`<tr><td colspan="8"><div class="empty"><i data-lucide="repeat-2"></i><p>No recurring deposits found.</p></div></td></tr>`;const count=document.getElementById('rd-visible-count');if(count)count.textContent=rows.length;const pg=document.getElementById('rd-pagination');if(pg)pg.innerHTML=`<div class="text-xs text-slate-500">Showing ${rows.length?((page-1)*size+1):0}–${Math.min(page*size,rows.length)} of ${rows.length}</div><div class="flex gap-2"><button class="ghost-btn" ${page<=1?'disabled':''} onclick="state.data.rdPage=${page-1};rdRenderTable()"><i data-lucide="chevron-left"></i>Previous</button><span class="rd-page-number">Page ${page} of ${pages}</span><button class="ghost-btn" ${page>=pages?'disabled':''} onclick="state.data.rdPage=${page+1};rdRenderTable()">Next<i data-lucide="chevron-right"></i></button></div>`;rdRenderMaturityAlert();lucide.createIcons();}
function rdRenderMaturityAlert(){const el=document.getElementById('rd-maturity-alert');if(!el)return;const soon=(state.data.rd||[]).filter(x=>String(x.status||'').toUpperCase()==='ACTIVE').map(x=>({x,days:rdDaysRemaining(x.maturityDate)})).filter(o=>o.days!==null&&o.days>=0&&o.days<=30).sort((a,b)=>a.days-b.days);el.innerHTML=soon.length?`<div class="rd-alert mb-5"><div class="mini-icon"><i data-lucide="bell-ring"></i></div><div><p class="font-semibold text-slate-800">${soon.length} RD${soon.length>1?'s are':' is'} maturing soon</p><p class="text-xs text-slate-500 mt-1">${soon.slice(0,3).map(o=>`${esc(o.x.rdNumber||'RD')} · ${o.days} day${o.days===1?'':'s'} remaining`).join(' &nbsp; • &nbsp; ')}</p></div></div>`:'';}
function rdById(id){return (state.data.rd||[]).find(x=>String(x.id)===String(id));}
function viewRD(id){const x=rdById(id);if(!x)return;const p=rdProgress(x),days=rdDaysRemaining(x.maturityDate),interest=Number(x.maturityAmount||0)-Number(x.totalDeposited||0);modal(`RD Details · ${esc(x.rdNumber||'Recurring Deposit')}`,`<div class="rd-detail-head"><div class="mini-icon"><i data-lucide="repeat-2"></i></div><div><p class="text-xs uppercase tracking-widest text-slate-400">Recurring Deposit</p><h3 class="font-bold text-lg">${esc(x.rdNumber||'—')}</h3></div><div class="ml-auto">${status(x.status)}</div></div><div class="rd-detail-progress"><div class="flex items-center justify-between"><span class="text-sm font-semibold">Installment progress</span><span class="text-sm font-semibold">${p.paid}/${p.total||'—'} · ${p.percent}%</span></div><div class="rd-progress mt-2"><span style="width:${p.percent}%"></span></div><p class="text-xs text-slate-500 mt-2">${p.remaining} installment${p.remaining===1?'':'s'} remaining</p></div><div class="rd-detail-grid">${[['Customer',rdCustomer(x)],['RD Number',x.rdNumber||'—'],['Monthly Installment',money(x.monthlyInstallment)],['Tenure',`${x.tenureMonths??'—'} months`],['Interest Rate',`${x.interestRate??'—'}%`],['Start Date',date(x.startDate)],['Maturity Date',date(x.maturityDate)],['Total Deposited',money(x.totalDeposited)],['Installments Paid',`${p.paid} / ${p.total||'—'}`],['Remaining Installments',p.remaining],['Interest Earned',money(Math.max(interest,0))],['Maturity Amount',money(x.maturityAmount)],['Maturity Tracking',days===null?'—':days<0?'Matured':`${days} day${days===1?'':'s'} remaining`],['Status',String(x.status||'—')]].map(a=>`<div class="rd-detail-box"><span>${esc(a[0])}</span><strong>${esc(a[1])}</strong></div>`).join('')}</div><div class="flex flex-wrap justify-end gap-2 mt-5"><button class="ghost-btn" onclick="closeModal()">Close</button>${String(x.status||'').toUpperCase()==='ACTIVE'&&p.remaining>0?`<button class="ghost-btn" onclick="openRDInstallment(${x.id})"><i data-lucide="circle-dollar-sign"></i>Pay Installment</button>`:''}<button class="primary-btn" onclick="showRDCertificate(${x.id})"><i data-lucide="file-badge"></i>View Certificate</button></div>`);}
function openRDInstallment(id){const x=rdById(id);if(!x)return;const p=rdProgress(x);if(String(x.status||'').toUpperCase()!=='ACTIVE'||p.remaining<=0){toast('Installment cannot be paid for this RD','error');return;}modal('Pay RD Installment',`<div class="rd-payment-card"><div class="rd-payment-icon"><i data-lucide="circle-dollar-sign"></i></div><div><p class="text-xs uppercase tracking-widest text-slate-400">Recurring Deposit</p><h3 class="text-lg font-bold mt-1">${esc(x.rdNumber||'—')}</h3></div></div><div class="rd-payment-grid"><div><span>Monthly Installment</span><strong>${money(x.monthlyInstallment)}</strong></div><div><span>Next Installment</span><strong>${p.paid+1} / ${p.total||'—'}</strong></div><div><span>Total Deposited</span><strong>${money(x.totalDeposited)}</strong></div><div><span>Remaining</span><strong>${p.remaining}</strong></div></div><div class="rd-confirm-note"><i data-lucide="shield-check"></i><span>The payment amount is fixed to the monthly installment configured for this RD.</span></div><div class="flex justify-end gap-2 mt-5"><button class="ghost-btn" onclick="closeModal()">Cancel</button><button class="primary-btn" onclick="submitRDInstallment(${id})"><i data-lucide="check-circle-2"></i>Confirm Payment</button></div>`);}
async function submitRDInstallment(id){const x=rdById(id);if(!x)return;try{const updated=await apiFetch(`/rd/${id}/installment?amount=${encodeURIComponent(x.monthlyInstallment)}`,{method:'POST'});closeModal();const i=(state.data.rd||[]).findIndex(r=>String(r.id)===String(id));if(i>=0)state.data.rd[i]=updated;toast('RD installment paid successfully');rdRenderTable();}catch(err){toast(err.message||'Unable to pay RD installment','error');}}
function rdCertificateData(x){const p=rdProgress(x);return {number:x.rdNumber||'—',customer:rdCustomer(x),monthly:money(x.monthlyInstallment),tenure:`${x.tenureMonths??'—'} months`,rate:`${x.interestRate??'—'}%`,start:date(x.startDate),maturity:date(x.maturityDate),deposited:money(x.totalDeposited),paid:`${p.paid} / ${p.total||'—'}`,amount:money(x.maturityAmount),status:String(x.status||'ACTIVE').toUpperCase()};}
function showRDCertificate(id){const x=rdById(id);if(!x)return;const d=rdCertificateData(x);modal('Recurring Deposit Certificate',`<div id="rd-certificate" class="rd-certificate"><div class="rd-cert-top"><div><p class="eyebrow">Finora Finance</p><h2>Recurring Deposit Certificate</h2></div><div class="rd-cert-icon"><i data-lucide="repeat-2"></i></div></div><div class="rd-cert-status">${status(d.status)}</div><div class="rd-cert-amount"><span>Maturity Amount</span><strong>${d.amount}</strong></div><div class="rd-cert-grid">${[['Customer Name',d.customer],['RD Number',d.number],['Monthly Installment',d.monthly],['Interest Rate',d.rate],['Tenure',d.tenure],['Start Date',d.start],['Maturity Date',d.maturity],['Total Deposited',d.deposited],['Installments Paid',d.paid]].map(a=>`<div><span>${esc(a[0])}</span><strong>${esc(a[1])}</strong></div>`).join('')}</div><div class="rd-cert-note">This is a system-generated recurring deposit certificate. Please keep it for your records.</div></div><div class="flex flex-wrap justify-end gap-2 mt-4"><button class="ghost-btn" onclick="closeModal()">Close</button><button class="ghost-btn" onclick="downloadRDCertificate(${id})"><i data-lucide="download"></i>Download</button><button class="ghost-btn" onclick="shareRDCertificate(${id})"><i data-lucide="share-2"></i>Share</button><button class="primary-btn" onclick="printRDCertificate()"><i data-lucide="printer"></i>Print</button></div>`);}
function rdCanvas(){const el=document.getElementById('rd-certificate');if(!el)return null;const c=document.createElement('canvas');c.width=1200;c.height=980;const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);ctx.strokeStyle='#dbe3ea';ctx.lineWidth=3;ctx.strokeRect(40,40,1120,900);ctx.fillStyle='#257566';ctx.font='700 34px Arial';ctx.fillText('FINORA FINANCE',90,110);ctx.fillStyle='#0f172a';ctx.font='700 30px Arial';ctx.fillText('Recurring Deposit Certificate',90,160);ctx.fillStyle='#f0f8f6';ctx.fillRect(90,200,1020,120);ctx.fillStyle='#64748b';ctx.font='18px Arial';ctx.fillText('Maturity Amount',120,240);ctx.fillStyle='#0f172a';ctx.font='700 40px Arial';ctx.fillText(el.querySelector('.rd-cert-amount strong')?.textContent||'—',120,290);ctx.font='18px Arial';ctx.fillStyle='#64748b';ctx.fillText('Status: '+(el.querySelector('.rd-cert-status')?.innerText||'ACTIVE').trim(),820,270);const cells=[...el.querySelectorAll('.rd-cert-grid>div')];cells.forEach((cell,i)=>{const col=i%2,row=Math.floor(i/2),xx=90+col*520,yy=370+row*92;ctx.fillStyle='#f8fafc';ctx.fillRect(xx,yy,490,68);ctx.fillStyle='#64748b';ctx.font='15px Arial';ctx.fillText(cell.querySelector('span')?.textContent||'',xx+18,yy+25);ctx.fillStyle='#0f172a';ctx.font='700 19px Arial';ctx.fillText(String(cell.querySelector('strong')?.textContent||'').slice(0,42),xx+18,yy+51);});ctx.fillStyle='#64748b';ctx.font='15px Arial';ctx.fillText('System-generated certificate · Finora Finance',90,905);return c;}
async function downloadRDCertificate(id){if(!document.getElementById('rd-certificate'))showRDCertificate(id);setTimeout(async()=>{const canvas=rdCanvas();if(!canvas)return;const blob=await new Promise(r=>canvas.toBlob(r,'image/png',1));if(!blob)return;const x=rdById(id),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=`Finora-RD-Certificate-${x?.rdNumber||id}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);toast('RD certificate downloaded');},50);}
async function shareRDCertificate(id){if(!document.getElementById('rd-certificate'))showRDCertificate(id);setTimeout(async()=>{const canvas=rdCanvas();if(!canvas)return;const blob=await new Promise(r=>canvas.toBlob(r,'image/png',1));if(!blob)return;const x=rdById(id),file=new File([blob],`Finora-RD-Certificate-${x?.rdNumber||id}.png`,{type:'image/png'});try{if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){await navigator.share({title:'Finora Finance - RD Certificate',text:`Recurring Deposit Certificate | ${x?.rdNumber||''}`,files:[file]});toast('RD certificate shared successfully');}else{await downloadRDCertificate(id);toast('Sharing is not supported here. Certificate image was saved.','info');}}catch(e){if(e?.name!=='AbortError')toast('Unable to share certificate','error');}},50);}
function printRDCertificate(){const slip=document.getElementById('rd-certificate');if(!slip)return;const w=window.open('','_blank','width=850,height=900');w.document.write(`<html><head><title>Recurring Deposit Certificate</title><style>body{font-family:Arial,sans-serif;padding:40px;color:#1e293b}.receipt{max-width:760px;margin:auto;border:1px solid #dbe3ea;border-radius:18px;padding:32px}.amount{background:#f0f8f6;padding:24px;margin:25px 0;border-radius:14px;font-size:28px;font-weight:700}.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.box{background:#f8fafc;padding:14px;border-radius:10px}.muted{color:#64748b;font-size:12px}</style></head><body><div class="receipt">${slip.innerHTML}</div><script>window.onload=()=>window.print()<\/script></body></html>`);w.document.close();}
function exportRDCSV(){const rows=Array.isArray(state.data.rd)?state.data.rd:[];if(!rows.length){toast('No RD records to download','info');return;}const header=['RD Number','User ID','Customer','Monthly Installment','Tenure Months','Interest Rate','Total Deposited','Installments Paid','Maturity Amount','Maturity Date','Status'];const escCsv=v=>'"'+String(v??'').replace(/"/g,'""')+'"';const csv=[header,...rows.map(x=>[x.rdNumber,x.userId,rdCustomer(x),x.monthlyInstallment,x.tenureMonths,x.interestRate,x.totalDeposited,x.installmentsPaid,x.maturityAmount,x.maturityDate,x.status])].map(r=>r.map(escCsv).join(',')).join('\r\n');const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='Finora-RD-Statement.csv';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);toast('RD statement downloaded');}

async function loanPage(c){
  const rowsRaw=await apiFetch('/loans');
  const rows=Array.isArray(rowsRaw)?rowsRaw:[];
  state.data.loans=rows;
  let users=[];
  try{const u=await apiFetch('/users');users=Array.isArray(u)?u:[];}catch(e){}
  state._loanUsers=users;
  const userMap=new Map(users.map(u=>[String(u.id),u]));
  const customer=x=>{const u=userMap.get(String(x.userId));return u?.name||`User #${x.userId??'—'}`;};
  state._loanCustomer=customer;
  const activeStatuses=['PENDING','APPROVED','DISBURSED','COMPLETED','REJECTED'];
  const render=()=>{
    const q=(document.getElementById('loan-search')?.value||'').toLowerCase().trim();
    const st=document.getElementById('loan-status')?.value||'ALL';
    const sort=document.getElementById('loan-sort')?.value||'NEWEST';
    const size=Number(document.getElementById('loan-page-size')?.value||10);
    let filtered=rows.filter(x=>{
      const hay=[x.loanNumber,x.userId,customer(x),x.loanAmount,x.emiAmount,x.outstandingAmount,x.status].join(' ').toLowerCase();
      return (!q||hay.includes(q))&&(st==='ALL'||String(x.status||'').toUpperCase()===st);
    });
    filtered.sort((a,b)=>{
      if(sort==='OLDEST')return new Date(a.applicationDate||a.createdAt||0)-new Date(b.applicationDate||b.createdAt||0);
      if(sort==='HIGH_AMOUNT')return Number(b.loanAmount||0)-Number(a.loanAmount||0);
      if(sort==='LOW_AMOUNT')return Number(a.loanAmount||0)-Number(b.loanAmount||0);
      if(sort==='HIGH_OUTSTANDING')return Number(b.outstandingAmount||0)-Number(a.outstandingAmount||0);
      return new Date(b.applicationDate||b.createdAt||0)-new Date(a.applicationDate||a.createdAt||0);
    });
    const totalPages=Math.max(1,Math.ceil(filtered.length/size));
    if(!state._loanPage||state._loanPage>totalPages)state._loanPage=1;
    const start=(state._loanPage-1)*size;
    const pageRows=filtered.slice(start,start+size);
    const body=document.getElementById('loan-body');
    if(body)body.innerHTML=pageRows.length?pageRows.map(x=>`<tr>
      <td><div class="font-semibold">${esc(x.loanNumber||'—')}</div><div class="text-xs text-slate-400">Loan #${esc(x.id)}</div></td>
      <td><div class="font-semibold">${esc(customer(x))}</div><div class="text-xs text-slate-400">User #${esc(x.userId??'—')}</div></td>
      <td class="font-semibold">${money(x.loanAmount)}</td><td>${money(x.emiAmount)}</td><td class="font-semibold">${money(x.outstandingAmount)}</td><td>${status(x.status)}</td>
      <td><div class="action-row loan-actions">${loanPageActions(x)}</div></td>
    </tr>`).join(''):`<tr><td colspan="7"><div class="empty"><i data-lucide="inbox"></i><p>No loans found.</p></div></td></tr>`;
    const info=document.getElementById('loan-page-info');if(info)info.textContent=`Showing ${filtered.length?start+1:0}-${Math.min(start+pageRows.length,filtered.length)} of ${filtered.length}`;
    const pager=document.getElementById('loan-pagination');if(pager)pager.innerHTML=`<button class="ghost-btn" ${state._loanPage<=1?'disabled':''} onclick="state._loanPage=Math.max(1,state._loanPage-1);filterLoans()">Previous</button><span class="text-sm font-semibold text-slate-600">${state._loanPage} / ${totalPages}</span><button class="ghost-btn" ${state._loanPage>=totalPages?'disabled':''} onclick="state._loanPage=Math.min(${totalPages},state._loanPage+1);filterLoans()">Next</button>`;
    lucide.createIcons();
  };
  state._loanRender=render;state._loanPage=1;
  const total=rows.length,pending=rows.filter(x=>String(x.status).toUpperCase()==='PENDING').length,approved=rows.filter(x=>String(x.status).toUpperCase()==='APPROVED').length,disbursed=rows.filter(x=>String(x.status).toUpperCase()==='DISBURSED').length,outstanding=rows.reduce((a,x)=>a+Number(x.outstandingAmount||0),0);
  c.innerHTML=`<div class="mb-7 flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><p class="text-sm text-slate-500">Applications, approvals and repayment tracking</p><h2 class="mt-1 text-2xl font-bold">Loans</h2></div><button class="primary-btn" onclick="openGenericForm('loans')"><i data-lucide="plus"></i>Apply for loan</button></div>
  <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
    ${loanStat('file-text','Total Loans',total,'Loan records')}
    ${loanStat('clock-3','Pending Applications',pending,'Awaiting decision')}
    ${loanStat('badge-check','Approved Loans',approved,'Ready for disbursement')}
    ${loanStat('banknote-arrow-up','Disbursed Loans',disbursed,'Currently disbursed')}
    ${loanStat('wallet-cards','Total Outstanding',money(outstanding),'Current outstanding')}
  </div>
  <div class="data-card mt-6"><div class="loan-toolbar"><div class="input-wrap loan-search"><i data-lucide="search"></i><input id="loan-search" oninput="state._loanPage=1;filterLoans()" placeholder="Search loan number, user ID or customer..."></div><select id="loan-status" onchange="state._loanPage=1;filterLoans()"><option value="ALL">All statuses</option>${activeStatuses.map(x=>`<option value="${x}">${x}</option>`).join('')}</select><select id="loan-sort" onchange="state._loanPage=1;filterLoans()"><option value="NEWEST">Newest</option><option value="OLDEST">Oldest</option><option value="HIGH_AMOUNT">Highest Loan Amount</option><option value="LOW_AMOUNT">Lowest Loan Amount</option><option value="HIGH_OUTSTANDING">Highest Outstanding</option></select><select id="loan-page-size" onchange="state._loanPage=1;filterLoans()"><option>10</option><option>20</option><option>50</option></select><button class="ghost-btn" onclick="exportLoansCSV()"><i data-lucide="file-spreadsheet"></i>Download Statement</button><button class="ghost-btn" onclick="refreshCurrent()"><i data-lucide="refresh-cw"></i>Refresh</button></div>
  <div class="table-wrap"><table class="data-table loan-table"><thead><tr><th>Loan</th><th>Customer</th><th>Amount</th><th>EMI</th><th>Outstanding</th><th>Status</th><th>Actions</th></tr></thead><tbody id="loan-body"></tbody></table></div><div class="loan-pager"><span id="loan-page-info"></span><div id="loan-pagination" class="flex items-center gap-2"></div></div></div>`;
  filterLoans();lucide.createIcons();
}
function loanStat(icon,title,value,note){return `<div class="stat-card"><div class="mini-icon"><i data-lucide="${icon}"></i></div><p class="mt-4 text-xs font-semibold uppercase tracking-widest text-slate-400">${title}</p><p class="mt-1 text-xl font-bold">${value}</p><p class="mt-1 text-xs text-slate-500">${note}</p></div>`;}
function filterLoans(){if(state._loanRender)state._loanRender();}
function loanPageActions(x){const s=String(x.status||'').toUpperCase(),id=x.id;let a=`<button class="action-btn" title="View loan" onclick="viewLoan(${id})"><i data-lucide="eye"></i>View</button>`;if(s==='PENDING'||s==='APPROVED')a+=`<button class="action-btn" title="Edit loan" onclick='openGenericForm("loans",${JSON.stringify(x)})'><i data-lucide="pencil"></i>Edit</button>`;if(s==='PENDING')a+=`<button class="action-btn" onclick="loanAction(${id},'approve')"><i data-lucide="badge-check"></i>Approve</button><button class="action-btn" onclick="loanAction(${id},'reject')"><i data-lucide="x-circle"></i>Reject</button>`;if(s==='APPROVED')a+=`<button class="action-btn" onclick="loanAction(${id},'disburse')"><i data-lucide="banknote-arrow-up"></i>Disburse</button>`;if(s==='DISBURSED')a+=`<button class="action-btn" onclick="openLoanPayment(${id})"><i data-lucide="circle-dollar-sign"></i>Pay EMI</button><button class="action-btn" onclick="generateEMI(${id})"><i data-lucide="calendar-plus"></i>Generate EMI</button>`;return a;}
function loanById(id){return (state.data.loans||[]).find(x=>Number(x.id)===Number(id));}
function loanCustomer(x){return state._loanCustomer?state._loanCustomer(x):`User #${x?.userId??'—'}`;}
function viewLoan(id){const x=loanById(id);if(!x)return;const total=Number(x.totalPayable||0),out=Number(x.outstandingAmount||0),paid=Math.max(total-out,0),pct=total>0?Math.min(100,(paid/total)*100):0;modal(`Loan Details · ${esc(x.loanNumber||'Loan')}`,`<div class="loan-detail-head"><div class="mini-icon"><i data-lucide="hand-coins"></i></div><div><p class="text-xs uppercase tracking-widest text-slate-400">Loan</p><h3 class="font-bold text-lg">${esc(x.loanNumber||'—')}</h3><p class="text-xs text-slate-500">${esc(loanCustomer(x))}</p></div><div class="ml-auto">${status(x.status)}</div></div><div class="loan-detail-grid">${[['Customer',loanCustomer(x)],['Loan Number',x.loanNumber||'—'],['Loan Amount',money(x.loanAmount)],['Interest Rate',`${x.interestRate??'—'}%`],['Tenure',`${x.tenureMonths??'—'} months`],['EMI',money(x.emiAmount)],['Total Payable',money(x.totalPayable)],['Outstanding',money(x.outstandingAmount)],['Purpose',x.purpose||'—'],['Application Date',date(x.applicationDate)],['Approval Date',date(x.approvalDate)],['Disbursement Date',date(x.disbursementDate)],['Status',x.status||'—']].map(a=>`<div class="loan-detail-box"><span>${esc(a[0])}</span><strong>${esc(a[1])}</strong></div>`).join('')}</div>${String(x.status||'').toUpperCase()==='DISBURSED'||String(x.status||'').toUpperCase()==='COMPLETED'?`<div class="loan-progress"><div class="flex justify-between text-sm"><span>Repayment progress</span><strong>${pct.toFixed(0)}%</strong></div><div class="loan-progress-bar"><span style="width:${pct}%"></span></div><div class="mt-3 grid grid-cols-3 gap-3 text-sm"><div><span>Total Payable</span><strong>${money(total)}</strong></div><div><span>Paid Amount</span><strong>${money(paid)}</strong></div><div><span>Outstanding</span><strong>${money(out)}</strong></div></div></div>`:''}<div class="flex flex-wrap justify-end gap-2 mt-5"><button class="ghost-btn" onclick="closeModal()">Close</button><button class="ghost-btn" onclick="showLoanCertificate(${id})"><i data-lucide="file-badge"></i>Certificate</button>${String(x.status||'').toUpperCase()==='DISBURSED'?`<button class="primary-btn" onclick="openLoanPayment(${id})"><i data-lucide="circle-dollar-sign"></i>Pay EMI</button>`:''}</div>`);}
function openLoanPayment(id){const x=loanById(id);if(!x)return;const s=String(x.status||'').toUpperCase();if(s!=='DISBURSED'){toast('EMI payment is available only for disbursed loans','error');return;}modal('Pay Loan EMI',`<div class="loan-payment-card"><div class="mini-icon"><i data-lucide="circle-dollar-sign"></i></div><div><p class="text-xs uppercase tracking-widest text-slate-400">Loan Payment</p><h3 class="text-lg font-bold mt-1">${esc(x.loanNumber||'—')}</h3></div></div><div class="loan-payment-grid"><div><span>EMI Amount</span><strong>${money(x.emiAmount)}</strong></div><div><span>Current Outstanding</span><strong>${money(x.outstandingAmount)}</strong></div></div><form onsubmit="submitLoanPayment(event,${id})" class="mt-5"><label class="field-label">Payment Amount</label><input id="loan-payment-amount" name="amount" type="number" step="0.01" min="0.01" value="${Number(x.emiAmount||0)}" class="field-input" required><p class="text-xs text-slate-500 mt-2">You can pay the EMI amount or another valid amount accepted by the existing API.</p><div class="flex justify-end gap-2 mt-5"><button type="button" class="ghost-btn" onclick="closeModal()">Cancel</button><button class="primary-btn" type="submit"><i data-lucide="check-circle-2"></i>Confirm Payment</button></div></form>`);}
async function submitLoanPayment(e,id){e.preventDefault();const amount=e.target.amount.value;if(!amount||Number(amount)<=0)return;try{await apiFetch(`/loans/${id}/payment?amount=${encodeURIComponent(amount)}`,{method:'POST'});closeModal();toast('Loan EMI payment recorded');renderPage();}catch(err){toast(err.message,'error');}}
function loanCertificateData(x){return {customer:loanCustomer(x),number:x.loanNumber||'—',amount:money(x.loanAmount),rate:`${x.interestRate??'—'}%`,tenure:`${x.tenureMonths??'—'} months`,emi:money(x.emiAmount),total:money(x.totalPayable),application:date(x.applicationDate),approval:date(x.approvalDate),disbursement:date(x.disbursementDate),status:String(x.status||'—')}}
function showLoanCertificate(id){const x=loanById(id);if(!x)return;const d=loanCertificateData(x);modal('Loan Sanction / Details',`<div id="loan-certificate" class="loan-certificate"><div class="loan-cert-top"><div><p class="eyebrow">Finora Finance</p><h2>Loan Sanction / Loan Details</h2></div><div class="loan-cert-icon"><i data-lucide="hand-coins"></i></div></div><div class="loan-cert-status">${status(d.status)}</div><div class="loan-cert-amount"><span>Loan Amount</span><strong>${d.amount}</strong></div><div class="loan-cert-grid">${[['Customer',d.customer],['Loan Number',d.number],['Interest Rate',d.rate],['Tenure',d.tenure],['EMI',d.emi],['Total Payable',d.total],['Application Date',d.application],['Approval Date',d.approval],['Disbursement Date',d.disbursement]].map(a=>`<div><span>${esc(a[0])}</span><strong>${esc(a[1])}</strong></div>`).join('')}</div><div class="loan-cert-note">This is a system-generated loan document. Please keep it for your records.</div></div><div class="flex flex-wrap justify-end gap-2 mt-4"><button class="ghost-btn" onclick="closeModal()">Close</button><button class="ghost-btn" onclick="downloadLoanCertificate(${id})"><i data-lucide="download"></i>Download</button><button class="ghost-btn" onclick="downloadLoanCertificate(${id})"><i data-lucide="image-down"></i>Save Image</button><button class="ghost-btn" onclick="shareLoanCertificate(${id})"><i data-lucide="share-2"></i>Share</button><button class="primary-btn" onclick="printLoanCertificate()"><i data-lucide="printer"></i>Print</button></div>`);}
function loanCertCanvas(id){const x=loanById(id);const d=loanCertificateData(x);const canvas=document.createElement('canvas');canvas.width=1400;canvas.height=1000;const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,1400,1000);ctx.fillStyle='#0f172a';ctx.font='700 40px Arial';ctx.fillText('FINORA FINANCE',80,90);ctx.font='700 30px Arial';ctx.fillText('Loan Sanction / Loan Details',80,140);ctx.font='600 26px Arial';ctx.fillText(`Status: ${d.status}`,1080,90);ctx.font='700 42px Arial';ctx.fillText(`Loan Amount: ${d.amount}`,80,220);const vals=[['Customer',d.customer],['Loan Number',d.number],['Interest Rate',d.rate],['Tenure',d.tenure],['EMI',d.emi],['Total Payable',d.total],['Application Date',d.application],['Approval Date',d.approval],['Disbursement Date',d.disbursement]];ctx.font='600 22px Arial';vals.forEach((v,i)=>{const col=i%2,row=Math.floor(i/2);const xx=80+col*650,yy=310+row*110;ctx.fillStyle='#64748b';ctx.fillText(v[0],xx,yy);ctx.fillStyle='#0f172a';ctx.font='700 25px Arial';ctx.fillText(String(v[1]),xx,yy+38);ctx.font='600 22px Arial';});ctx.fillStyle='#94a3b8';ctx.font='18px Arial';ctx.fillText('System-generated loan document.',80,930);return canvas;}
function downloadLoanCertificate(id){loanCertCanvas(id).toBlob(blob=>{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`Finora-Loan-${loanById(id)?.loanNumber||id}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);},'image/png');}
async function shareLoanCertificate(id){const canvas=loanCertCanvas(id);canvas.toBlob(async blob=>{const file=new File([blob],`Finora-Loan-${loanById(id)?.loanNumber||id}.png`,{type:'image/png'});if(navigator.share&&navigator.canShare?.({files:[file]})){try{await navigator.share({title:'Finora Loan Document',files:[file]});}catch(e){} }else{downloadLoanCertificate(id);toast('Sharing is not supported here, so the document was downloaded.','info');}},'image/png');}
function printLoanCertificate(){const el=document.getElementById('loan-certificate');if(!el)return;const w=window.open('','_blank','width=900,height=700');w.document.write(`<html><head><title>Finora Loan Document</title><style>body{font-family:Arial,sans-serif;padding:30px;color:#0f172a} .loan-certificate{max-width:800px;margin:auto;border:1px solid #e2e8f0;border-radius:20px;padding:28px} .loan-cert-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:25px}.loan-cert-grid div{border:1px solid #e2e8f0;padding:14px;border-radius:12px}.loan-cert-grid span{display:block;color:#64748b;font-size:12px}.loan-cert-grid strong{display:block;margin-top:5px}.loan-cert-amount{margin:25px 0;padding:20px;border-radius:16px;background:#f8fafc}.loan-cert-amount span{display:block;color:#64748b}.loan-cert-amount strong{font-size:30px}.loan-cert-top{display:flex;justify-content:space-between}.loan-cert-status{margin-top:15px;font-weight:700}</style></head><body>${el.outerHTML}</body></html>`);w.document.close();w.focus();w.print();}
function exportLoansCSV(){const rows=loanFilteredRows();if(!rows.length){toast('No loans to download','info');return;}const header=['Loan Number','User','Customer','Loan Amount','Interest Rate','Tenure','EMI','Total Payable','Outstanding','Status','Application Date','Disbursement Date'];const q=v=>'"'+String(v??'').replace(/"/g,'""')+'"';const csv=[header,...rows.map(x=>[x.loanNumber,x.userId,loanCustomer(x),x.loanAmount,x.interestRate,x.tenureMonths,x.emiAmount,x.totalPayable,x.outstandingAmount,x.status,x.applicationDate,x.disbursementDate])].map(r=>r.map(q).join(',')).join('\r\n');const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Finora-Loan-Statement.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Loan statement downloaded');}
function loanFilteredRows(){const q=(document.getElementById('loan-search')?.value||'').toLowerCase().trim(),st=document.getElementById('loan-status')?.value||'ALL';return (state.data.loans||[]).filter(x=>{const hay=[x.loanNumber,x.userId,loanCustomer(x),x.loanAmount,x.emiAmount,x.outstandingAmount,x.status].join(' ').toLowerCase();return (!q||hay.includes(q))&&(st==='ALL'||String(x.status||'').toUpperCase()===st);});}
async function savingAccountsPage(c){
  const [accountsRes,usersRes,txRes]=await Promise.allSettled([apiFetch('/savings'),apiFetch('/users'),apiFetch('/transactions')]);
  const accounts=accountsRes.status==='fulfilled'?(Array.isArray(accountsRes.value)?accountsRes.value:[]):[];
  const users=usersRes.status==='fulfilled'?(Array.isArray(usersRes.value)?usersRes.value:[]):[];
  const txs=txRes.status==='fulfilled'?(Array.isArray(txRes.value)?txRes.value:[]):[];
  state.data.savings=accounts; state.data.users=users; state.data.transactions=txs;
  state._savingUsers=users;
  c.innerHTML=`
    <div class="saving-head">
      <div><div class="flex items-center gap-3"><div class="mini-icon"><i data-lucide="wallet-cards"></i></div><div><h2 class="text-2xl font-bold">Savings Accounts</h2><p class="mt-1 text-sm text-slate-500">Manage balances, account status and customer transactions.</p></div></div></div>
      <button class="primary-btn" onclick="openSavingCreateForm()"><i data-lucide="plus"></i>Create account</button>
    </div>
    <div id="saving-dashboard-cards" class="saving-stats"></div>
    <div class="data-card saving-panel">
      <div class="saving-toolbar">
        <div class="saving-toolbar-title"><p><span id="saving-visible-count">${accounts.length}</span> account(s)</p><span>Live data from your Spring Boot APIs.</span></div>
        <div class="saving-controls">
          <div class="input-wrap saving-search"><i data-lucide="search"></i><input id="saving-search" placeholder="Search account, user ID or customer..." oninput="savingRenderTable()"></div>
          <select id="saving-status-filter" class="toolbar-select" onchange="savingRenderTable()"><option value="ALL">All status</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select>
          <select id="saving-type-filter" class="toolbar-select" onchange="savingRenderTable()"><option value="ALL">All types</option><option value="SAVINGS">Savings</option><option value="CURRENT">Current</option></select>
          <select id="saving-sort" class="toolbar-select" onchange="savingRenderTable()"><option value="NEWEST">Newest</option><option value="OLDEST">Oldest</option><option value="BALANCE_HIGH">Highest Balance</option><option value="BALANCE_LOW">Lowest Balance</option></select>
          <select id="saving-page-size" class="toolbar-select" onchange="state._savingPage=1;savingRenderTable()"><option value="10">10 records</option><option value="20">20 records</option><option value="50">50 records</option></select>
        </div>
      </div>
      <div class="table-wrap saving-table-wrap"><table class="data-table saving-table"><thead><tr><th>Account Number</th><th>Customer</th><th>Type</th><th>Balance</th><th>Status</th><th>Actions</th></tr></thead><tbody id="saving-table-body"></tbody></table></div>
      <div id="saving-pagination" class="saving-pagination"></div>
    </div>`;
  state._savingPage=1;
  savingRenderDashboard(); savingRenderTable(); lucide.createIcons();
}
function savingCustomer(account){
  const id=account?.userId;
  const u=(state._savingUsers||[]).find(x=>String(x.id)===String(id));
  return u?.name||u?.fullName||u?.customerName||account?.accountHolderName||`User #${id??'—'}`;
}
function savingRenderDashboard(){
  const rows=state.data.savings||[];
  const active=rows.filter(x=>String(x.status||'').toUpperCase()==='ACTIVE').length;
  const inactive=rows.filter(x=>String(x.status||'').toUpperCase()==='INACTIVE').length;
  const balance=rows.reduce((a,x)=>a+Number(x.balance||0),0);
  const txs=state.data.transactions||[];
  const el=document.getElementById('saving-dashboard-cards'); if(!el)return;
  el.innerHTML=`<div class="stat-card"><div class="mini-icon"><i data-lucide="wallet-cards"></i></div><p class="mt-4 text-xs font-semibold uppercase tracking-widest text-slate-400">Total accounts</p><p class="mt-1 text-2xl font-bold">${rows.length}</p><p class="mt-1 text-xs text-slate-500">All saving accounts</p></div>
  <div class="stat-card"><div class="mini-icon"><i data-lucide="circle-check"></i></div><p class="mt-4 text-xs font-semibold uppercase tracking-widest text-slate-400">Active accounts</p><p class="mt-1 text-2xl font-bold">${active}</p><p class="mt-1 text-xs text-slate-500">Ready for transactions</p></div>
  <div class="stat-card"><div class="mini-icon"><i data-lucide="circle-off"></i></div><p class="mt-4 text-xs font-semibold uppercase tracking-widest text-slate-400">Inactive accounts</p><p class="mt-1 text-2xl font-bold">${inactive}</p><p class="mt-1 text-xs text-slate-500">Currently restricted</p></div>
  <div class="stat-card"><div class="mini-icon"><i data-lucide="indian-rupee"></i></div><p class="mt-4 text-xs font-semibold uppercase tracking-widest text-slate-400">Total balance</p><p class="mt-1 text-2xl font-bold">${money(balance)}</p><p class="mt-1 text-xs text-slate-500">Across all accounts</p></div>
  <div class="stat-card"><div class="mini-icon"><i data-lucide="receipt-text"></i></div><p class="mt-4 text-xs font-semibold uppercase tracking-widest text-slate-400">Total transactions</p><p class="mt-1 text-2xl font-bold">${txs.length}</p><p class="mt-1 text-xs text-slate-500">Available transaction records</p></div>`;
  lucide.createIcons();
}
function savingFilteredRows(){
  const q=(document.getElementById('saving-search')?.value||'').toLowerCase().trim();
  const statusF=document.getElementById('saving-status-filter')?.value||'ALL';
  const typeF=document.getElementById('saving-type-filter')?.value||'ALL';
  const sort=document.getElementById('saving-sort')?.value||'NEWEST';
  let rows=(state.data.savings||[]).filter(x=>{
    const hay=[x.accountNumber,x.userId,x.accountType,savingCustomer(x)].join(' ').toLowerCase();
    const st=String(x.status||'').toUpperCase(), type=String(x.accountType||'').toUpperCase();
    return (!q||hay.includes(q))&&(statusF==='ALL'||st===statusF)&&(typeF==='ALL'||type===typeF);
  });
  rows.sort((a,b)=>{if(sort==='BALANCE_HIGH')return Number(b.balance||0)-Number(a.balance||0);if(sort==='BALANCE_LOW')return Number(a.balance||0)-Number(b.balance||0);const ad=new Date(a.createdAt||a.id||0).getTime(),bd=new Date(b.createdAt||b.id||0).getTime();return sort==='OLDEST'?ad-bd:bd-ad;});
  return rows;
}
function savingRenderTable(){
  const body=document.getElementById('saving-table-body'); if(!body)return;
  const rows=savingFilteredRows(); const size=Number(document.getElementById('saving-page-size')?.value||10); const page=state._savingPage||1; const totalPages=Math.max(1,Math.ceil(rows.length/size)); if(page>totalPages)state._savingPage=totalPages;
  const start=((state._savingPage||1)-1)*size, visible=rows.slice(start,start+size); const count=document.getElementById('saving-visible-count'); if(count)count.textContent=rows.length;
  body.innerHTML=visible.length?visible.map(x=>{const active=String(x.status||'').toUpperCase()==='ACTIVE';return `<tr><td class="font-semibold">${esc(x.accountNumber||'—')}</td><td><div class="saving-customer"><span class="saving-avatar">${esc(initials(savingCustomer(x)))}</span><div><strong>${esc(savingCustomer(x))}</strong><small>User #${esc(x.userId??'—')}</small></div></div></td><td>${esc(x.accountType||'—')}</td><td class="font-semibold">${money(x.balance)}</td><td>${status(x.status)}</td><td><div class="action-row saving-actions"><button class="action-btn" onclick="viewSavingAccount(${x.id})"><i data-lucide="eye"></i>View</button><button class="action-btn" ${active?'':'disabled title="Inactive account"'} onclick="${active?`openSavingMoneyModal(${x.id},'DEPOSIT')`:''}"><i data-lucide="arrow-down-to-line"></i>Deposit</button><button class="action-btn" ${active?'':'disabled title="Inactive account"'} onclick="${active?`openSavingMoneyModal(${x.id},'WITHDRAWAL')`:''}"><i data-lucide="arrow-up-from-line"></i>Withdraw</button><button class="action-btn" onclick='openGenericForm("savings",${JSON.stringify(x)})'><i data-lucide="pencil"></i>Edit</button></div></td></tr>`;}).join(''):`<tr><td colspan="6"><div class="empty"><i data-lucide="inbox"></i><p>No saving accounts match your filters.</p></div></td></tr>`;
  const pager=document.getElementById('saving-pagination'); pager.innerHTML=`<div><span>Showing ${visible.length?start+1:0}-${Math.min(start+visible.length,rows.length)} of ${rows.length}</span></div><div class="saving-page-buttons"><button class="ghost-btn" ${state._savingPage<=1?'disabled':''} onclick="state._savingPage=Math.max(1,(state._savingPage||1)-1);savingRenderTable()">Previous</button>${Array.from({length:Math.min(totalPages,5)},(_,i)=>i+1).map(n=>`<button class="saving-page-btn ${n===state._savingPage?'active':''}" onclick="state._savingPage=${n};savingRenderTable()">${n}</button>`).join('')}<button class="ghost-btn" ${state._savingPage>=totalPages?'disabled':''} onclick="state._savingPage=Math.min(${totalPages},(state._savingPage||1)+1);savingRenderTable()">Next</button></div>`;
  lucide.createIcons();
}
async function viewSavingAccount(id){
  try{
    const account=await apiFetch(`/savings/${id}`); let txs=[]; try{txs=await apiFetch(`/transactions/account/${id}`)||[];}catch(e){txs=[];}
    const holder=savingCustomer(account), deposits=txs.filter(x=>String(x.type).toUpperCase()==='DEPOSIT').reduce((a,x)=>a+Number(x.amount||0),0), withdrawals=txs.filter(x=>String(x.type).toUpperCase()==='WITHDRAWAL').reduce((a,x)=>a+Number(x.amount||0),0), net=deposits-withdrawals;
    state._savingView={account,txs};
    const recent=txs.slice().sort((a,b)=>new Date(b.transactionDate)-new Date(a.transactionDate)).slice(0,6);
    modal('Saving Account Details',`<div class="saving-detail-head"><div><div class="saving-avatar saving-avatar-lg">${esc(initials(holder))}</div></div><div><p class="text-xs uppercase tracking-widest text-slate-400">Customer</p><h3 class="text-xl font-bold mt-1">${esc(holder)}</h3><p class="text-sm text-slate-500 mt-1">Account ${esc(account.accountNumber||'—')}</p></div><div class="ml-auto">${status(account.status)}</div></div>
      <div class="saving-detail-grid"><div><span>Account Number</span><strong>${esc(account.accountNumber||'—')}</strong></div><div><span>User ID</span><strong>${esc(account.userId??'—')}</strong></div><div><span>Account Type</span><strong>${esc(account.accountType||'—')}</strong></div><div><span>Current Balance</span><strong>${money(account.balance)}</strong></div><div><span>Status</span><strong>${esc(account.status||'—')}</strong></div><div><span>Account ID</span><strong>${esc(account.id??'—')}</strong></div></div>
      <div class="saving-summary-grid"><div><span>Total Deposits</span><strong>${money(deposits)}</strong></div><div><span>Total Withdrawals</span><strong>${money(withdrawals)}</strong></div><div><span>Net Movement</span><strong>${money(net)}</strong></div></div>
      <div class="saving-view-actions"><button class="ghost-btn" onclick="savingAccountSummary(${account.id})"><i data-lucide="file-text"></i>Account Summary</button><button class="ghost-btn" onclick="exportSavingStatement(${account.id})"><i data-lucide="download"></i>Download Statement</button>${String(account.status).toUpperCase()==='ACTIVE'?`<button class="ghost-btn" onclick="toggleSavingStatus(${account.id},'INACTIVE')"><i data-lucide="circle-off"></i>Deactivate</button>`:`<button class="ghost-btn" onclick="toggleSavingStatus(${account.id},'ACTIVE')"><i data-lucide="circle-check"></i>Activate</button>`}</div>
      <div class="saving-transactions"><div class="flex items-center justify-between mb-3"><div><h4 class="font-bold">Recent Transactions</h4><p class="text-xs text-slate-500 mt-1">Latest account activity</p></div><span class="text-xs text-slate-400">${txs.length} total</span></div>${recent.length?`<div class="table-wrap"><table class="data-table"><thead><tr><th>Reference</th><th>Type</th><th>Amount</th><th>Balance After</th><th>Date</th><th>Status</th></tr></thead><tbody>${recent.map(t=>`<tr><td class="font-semibold">${esc(t.transactionReference||'—')}</td><td>${esc(t.type||'—')}</td><td>${money(t.amount)}</td><td>${money(t.balanceAfterTransaction)}</td><td>${date(t.transactionDate)}</td><td>${status('SUCCESS')}</td></tr>`).join('')}</tbody></table></div>`:`<div class="empty"><i data-lucide="receipt-text"></i><p>No transactions for this account.</p></div>`}</div>`);
  }catch(err){toast(err.message,'error');}
}
function openSavingMoneyModal(id,type){
  const account=(state.data.savings||[]).find(x=>String(x.id)===String(id)); if(!account)return;
  const holder=savingCustomer(account), isDeposit=type==='DEPOSIT';
  modal(isDeposit?'Deposit Money':'Withdraw Money',`<div class="saving-money-head"><div class="mini-icon"><i data-lucide="${isDeposit?'arrow-down-to-line':'arrow-up-from-line'}"></i></div><div><p class="text-xs text-slate-400">${esc(holder)}</p><h3 class="font-bold">${esc(account.accountNumber||'—')}</h3><p class="text-xs text-slate-500 mt-1">Current balance: <strong>${money(account.balance)}</strong></p></div></div><form onsubmit="submitSavingMoney(event,${id},'${type}')" class="space-y-4 mt-5"><div><label class="field-label">${isDeposit?'Deposit':'Withdrawal'} Amount</label><div class="input-wrap"><i data-lucide="indian-rupee"></i><input id="saving-money-amount" name="amount" type="number" min="0.01" step="0.01" required placeholder="Enter amount" oninput="previewSavingMoney(${Number(account.balance||0)},'${type}')"></div></div><div><label class="field-label">Description</label><div class="input-wrap"><i data-lucide="message-square-text"></i><input name="description" placeholder="Enter a short description"></div></div><div class="saving-balance-preview"><div><span>Current Balance</span><strong>${money(account.balance)}</strong></div><div><span>${isDeposit?'New Balance':'Remaining Balance'}</span><strong id="saving-new-balance">${money(account.balance)}</strong></div></div><div class="flex justify-end gap-2 pt-2"><button type="button" class="ghost-btn" onclick="closeModal()">Cancel</button><button type="submit" class="primary-btn"><i data-lucide="check"></i>Confirm ${isDeposit?'Deposit':'Withdrawal'}</button></div></form>`);
}
function previewSavingMoney(balance,type){const a=Number(document.getElementById('saving-money-amount')?.value||0),n=type==='DEPOSIT'?balance+a:balance-a,el=document.getElementById('saving-new-balance');if(el){el.textContent=money(n);el.classList.toggle('text-rose-600',n<0);}}
async function submitSavingMoney(e,id,type){e.preventDefault();const amount=Number(e.target.amount.value);const account=(state.data.savings||[]).find(x=>String(x.id)===String(id));if(!account||amount<=0)return;if(type==='WITHDRAWAL'&&amount>Number(account.balance||0)){toast('Insufficient balance.','error');return;}try{const tx=await apiFetch('/transactions',{method:'POST',body:JSON.stringify({savingAccountId:Number(id),type,amount,description:e.target.description.value||`${type==='DEPOSIT'?'Deposit':'Withdrawal'} from savings account`})});closeModal();toast(type==='DEPOSIT'?'Deposit successful':'Withdrawal successful');renderPage();setTimeout(()=>{if(tx?.id)showSavingTransactionReceipt(tx,id);},250);}catch(err){toast(err.message,'error');}}
async function showSavingTransactionReceipt(tx,accountId){
  try{
    const account=await apiFetch(`/savings/${accountId}`); const holder=savingCustomer(account); const isDeposit=String(tx.type).toUpperCase()==='DEPOSIT';
    const previous=Number(tx.balanceAfterTransaction||0)+(isDeposit?-Number(tx.amount||0):Number(tx.amount||0));
    state._paymentSlipTx={...tx,accountNumber:account.accountNumber||'—',accountHolder:holder,typeLabel:isDeposit?'Money Credited':'Money Debited'};
    modal('Transaction Receipt',`<div class="saving-receipt" id="saving-receipt"><div class="saving-receipt-top"><div><p class="text-xs uppercase tracking-widest text-slate-400">Finora Finance</p><h3>Transaction Receipt</h3></div><div class="text-right">${status('SUCCESS')}<p class="text-xs text-slate-400 mt-2">${date(tx.transactionDate)}</p></div></div><div class="saving-receipt-amount"><span>${isDeposit?'Deposit':'Withdrawal'} Amount</span><strong>${money(tx.amount)}</strong><small>${esc(tx.transactionReference||'—')}</small></div><div class="saving-receipt-grid"><div><span>Customer</span><strong>${esc(holder)}</strong></div><div><span>Account Number</span><strong>${esc(account.accountNumber||'—')}</strong></div><div><span>Transaction Type</span><strong>${esc(tx.type||'—')}</strong></div><div><span>Previous Balance</span><strong>${money(previous)}</strong></div><div><span>Balance After</span><strong>${money(tx.balanceAfterTransaction)}</strong></div><div><span>Date</span><strong>${date(tx.transactionDate)}</strong></div></div><div class="saving-receipt-description"><span>Description</span><strong>${esc(tx.description||'No description')}</strong></div></div><div class="mt-5 flex flex-wrap justify-end gap-2"><button class="ghost-btn" onclick="closeModal()">Close</button><button class="ghost-btn" onclick="downloadPaymentSlipImage()"><i data-lucide="download"></i>Download</button><button class="ghost-btn" onclick="sharePaymentSlip()"><i data-lucide="share-2"></i>Share</button><button class="primary-btn" onclick="printPaymentSlip()"><i data-lucide="printer"></i>Print</button></div>`);
  }catch(err){toast(err.message,'error');}
}
function savingAccountSummary(id){
  const account=(state.data.savings||[]).find(x=>String(x.id)===String(id)); if(!account)return;
  const holder=savingCustomer(account),created=account.createdAt||account.createdDate||account.accountCreatedAt||'—';
  modal('Savings Account Summary',`<div class="saving-summary-card"><div class="saving-summary-brand"><div class="mini-icon"><i data-lucide="landmark"></i></div><div><p class="text-xs uppercase tracking-widest text-slate-400">Finora Finance</p><h3>Savings Account Summary</h3></div></div><div class="saving-summary-main"><p class="text-xs text-slate-400">Account Number</p><strong>${esc(account.accountNumber||'—')}</strong><p class="mt-2 text-2xl font-bold">${money(account.balance)}</p><p class="text-xs text-slate-500">Current Balance</p></div><div class="saving-detail-grid"><div><span>Customer</span><strong>${esc(holder)}</strong></div><div><span>User ID</span><strong>${esc(account.userId??'—')}</strong></div><div><span>Account Type</span><strong>${esc(account.accountType||'—')}</strong></div><div><span>Status</span><strong>${esc(account.status||'—')}</strong></div><div><span>Account ID</span><strong>${esc(account.id??'—')}</strong></div><div><span>Created</span><strong>${created==='—'?'—':date(created)}</strong></div></div></div><div class="mt-5 flex justify-end gap-2"><button class="ghost-btn" onclick="closeModal()">Close</button><button class="primary-btn" onclick="printSavingSummary(${id})"><i data-lucide="printer"></i>Print Summary</button></div>`);
}
function printSavingSummary(id){const account=(state.data.savings||[]).find(x=>String(x.id)===String(id));if(!account)return;const holder=savingCustomer(account),w=window.open('','_blank','width=800,height=600');if(!w){toast('Please allow pop-ups to print the summary.','error');return;}w.document.write(`<html><head><title>Savings Account Summary</title><style>body{font-family:Arial,sans-serif;padding:40px;color:#172b31}.card{max-width:650px;margin:auto;border:1px solid #dbe3ea;border-radius:18px;padding:28px}h1{margin:0 0 4px}p{color:#64748b}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:22px}.box{padding:14px;background:#f8fafc;border-radius:10px}.box small{display:block;color:#64748b}.box strong{display:block;margin-top:5px}</style></head><body><div class="card"><h1>FINORA FINANCE</h1><p>Savings Account Summary</p><h2>${esc(account.accountNumber||'—')}</h2><h1>${money(account.balance)}</h1><p>Current Balance</p><div class="grid"><div class="box"><small>Customer</small><strong>${esc(holder)}</strong></div><div class="box"><small>User ID</small><strong>${esc(account.userId??'—')}</strong></div><div class="box"><small>Account Type</small><strong>${esc(account.accountType||'—')}</strong></div><div class="box"><small>Status</small><strong>${esc(account.status||'—')}</strong></div><div class="box"><small>Account ID</small><strong>${esc(account.id??'—')}</strong></div></div></div><script>window.onload=()=>window.print();</script></body></html>`);w.document.close();}

async function toggleSavingStatus(id,newStatus){try{await apiFetch(`/savings/${id}`,{method:'PATCH',body:JSON.stringify({status:newStatus})});closeModal();toast(`Account ${newStatus==='ACTIVE'?'activated':'deactivated'} successfully`);renderPage();}catch(err){toast(err.message,'error');}}
function savingStatementRows(account,txs){return txs.slice().sort((a,b)=>new Date(a.transactionDate)-new Date(b.transactionDate));}
async function exportSavingStatement(id){try{const account=await apiFetch(`/savings/${id}`);const txs=await apiFetch(`/transactions/account/${id}`)||[];const holder=savingCustomer(account),head=['Account Number','Customer','Reference','Type','Amount','Balance After','Description','Date'];const q=v=>'"'+String(v??'').replace(/"/g,'""')+'"';const csv=[head,...savingStatementRows(account,txs).map(t=>[account.accountNumber,holder,t.transactionReference,t.type,t.amount,t.balanceAfterTransaction,t.description,t.transactionDate])].map(r=>r.map(q).join(',')).join('\r\n');const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`Finora-Savings-Statement-${account.accountNumber||id}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Savings statement downloaded');}catch(err){toast(err.message,'error');}}
async function printSavingStatement(id){try{const account=await apiFetch(`/savings/${id}`),txs=await apiFetch(`/transactions/account/${id}`)||[],holder=savingCustomer(account);const rows=savingStatementRows(account,txs).map(t=>`<tr><td>${esc(t.transactionReference)}</td><td>${esc(t.type)}</td><td>${money(t.amount)}</td><td>${money(t.balanceAfterTransaction)}</td><td>${date(t.transactionDate)}</td></tr>`).join('');const w=window.open('','_blank','width=1000,height=700');if(!w){toast('Please allow pop-ups to print the statement.','error');return;}w.document.write(`<html><head><title>Savings Account Statement</title><style>body{font-family:Arial,sans-serif;padding:32px;color:#172b31}h1{margin:0}p{color:#64748b}table{width:100%;border-collapse:collapse;margin-top:24px}th,td{padding:10px;border:1px solid #dbe3ea;text-align:left}th{background:#f4f8f7}.summary{display:flex;gap:28px;margin-top:20px}.box{padding:14px;background:#f8fafc;border-radius:10px}</style></head><body><h1>FINORA FINANCE</h1><p>Savings Account Statement</p><div class="summary"><div class="box"><b>Customer</b><br>${esc(holder)}</div><div class="box"><b>Account</b><br>${esc(account.accountNumber||'—')}</div><div class="box"><b>Balance</b><br>${money(account.balance)}</div></div><table><thead><tr><th>Reference</th><th>Type</th><th>Amount</th><th>Balance After</th><th>Date</th></tr></thead><tbody>${rows||'<tr><td colspan="5">No transactions</td></tr>'}</tbody></table><script>window.onload=()=>window.print();</script></body></html>`);w.document.close();}catch(err){toast(err.message,'error');}}

async function modulePage(c,key){if(key==='emi')return emiPage(c);const cfg=CONFIG[key];const rows=await apiFetch(cfg.endpoint);state.data[key]=rows;const filters=filterableCols(cfg);const body=`${toolbarHtml(cfg,rows)}<div class="table-wrap"><table id="module-table" class="data-table"><thead><tr>${cfg.cols.map(x=>`<th>${x[1]}</th>`).join('')}<th>Actions</th></tr></thead><tbody>${rows.length?rows.map(x=>{const dataAttrs=filters.map(col=>`data-${col[0]}="${esc(String(x[col[0]]??'').toLowerCase())}"`).join(' ');return `<tr data-search="${esc(JSON.stringify(x).toLowerCase())}" ${dataAttrs}>${cfg.cols.map(col=>`<td>${formatCell(x[col[0]],col[2])}</td>`).join('')}<td><div class="action-row"><button class="action-btn" onclick='openGenericForm("${key}",${JSON.stringify(x)})'><i data-lucide="pencil"></i>Edit</button><button class="action-btn" onclick="deleteRecord('${key}',${x.id})"><i data-lucide="trash-2"></i>Delete</button>${key==='rd'?`<button class="action-btn" onclick="payRD(${x.id})"><i data-lucide="circle-dollar-sign"></i>Installment</button>`:''}${key==='loans'?loanActions(x):''}</div></td></tr>`;}).join(''):`<tr><td colspan="${cfg.cols.length+1}"><div class="empty"><i data-lucide="inbox"></i><p>No records found.</p></div></td></tr>`}</tbody></table></div>`;c.innerHTML=moduleShell(cfg.title,cfg.subtitle,cfg.icon,cfg.create,`openGenericForm('${key}')`,body);lucide.createIcons();}
function formatCell(v,type){if(type==='money')return `<span class="font-semibold">${money(v)}</span>`;if(type==='date')return date(v);if(type==='status')return status(v);return esc(v??'—');}
function filterTable(){const q=(document.getElementById('table-search')?.value||'').toLowerCase();const selects=[...document.querySelectorAll('.toolbar-select[id^="filter-"]')];document.querySelectorAll('#module-table tbody tr').forEach(r=>{const matchesSearch=!r.dataset.search||r.dataset.search.includes(q);const matchesFilters=selects.every(sel=>{const val=sel.value;if(!val)return true;const field=sel.id.replace('filter-','');return r.dataset[field]===val;});r.style.display=(matchesSearch&&matchesFilters)?'':'none';});}
function loanActions(x){let a='';if(x.status==='PENDING')a+=`<button class="action-btn" onclick="loanAction(${x.id},'approve')">Approve</button><button class="action-btn" onclick="loanAction(${x.id},'reject')">Reject</button>`;if(x.status==='APPROVED')a+=`<button class="action-btn" onclick="loanAction(${x.id},'disburse')">Disburse</button>`;a+=`<button class="action-btn" onclick="generateEMI(${x.id})"><i data-lucide="calendar-plus"></i>Generate EMI</button>`;return a;}
async function emiPage(c){
  let loanId=state.data.selectedLoanId||sessionStorage.getItem('finora_emi_loan_id')||'';
  if(!loanId){
    c.innerHTML=moduleShell('EMI Schedule','Search a loan to view its complete repayment schedule','calendar-clock','','',`<div class="emi-search-card"><div><p class="eyebrow">Repayment</p><h3 class="text-lg font-bold mt-1">View EMI Schedule</h3><p class="text-sm text-slate-500 mt-1">Enter a Loan ID to load the customer’s EMI details.</p></div><form onsubmit="loadEMIByLoan(event)" class="emi-search-form"><div class="input-wrap"><i data-lucide="search"></i><input id="emi-loan-search" type="number" min="1" placeholder="Enter Loan ID" required></div><button class="primary-btn" type="submit"><i data-lucide="calendar-search"></i>View EMI Schedule</button></form></div>`);lucide.createIcons();return;
  }
  loanId=String(loanId).trim();
  try{
    // Reconcile payments that were recorded from the Loan module before
    // loading the schedule, then read the latest EMI rows.
    try{await apiFetch(`/emi-schedules/sync/${encodeURIComponent(loanId)}`,{method:'POST'});}catch(_){}
    const rows=await apiFetch(`/emi-schedules/loan/${encodeURIComponent(loanId)}`);
    state.data.emi=Array.isArray(rows)?rows:[]; state.data.selectedLoanId=loanId; sessionStorage.setItem('finora_emi_loan_id',loanId);
    let loan=loanById(loanId);
    if(!loan){try{loan=await apiFetch(`/loans/${encodeURIComponent(loanId)}`);}catch(e){try{const loans=await apiFetch('/loans');state.data.loans=loans;loan=loanById(loanId);}catch(_){} }}
    state.data.selectedEmiLoan=loan||null;
    let customerName=loan?`User #${loan.userId??'—'}`:'—';
    if(loan?.userId){try{if(!state.data.users)state.data.users=await apiFetch('/users');const u=(state.data.users||[]).find(x=>Number(x.id)===Number(loan.userId));if(u?.name)customerName=u.name;}catch(_){} }
    state.data.selectedEmiCustomer=customerName;
    renderEMISchedulePage(c);
  }catch(err){
    c.innerHTML=moduleShell('EMI Schedule','Unable to load the selected repayment schedule','calendar-clock','','',`<div class="empty"><i data-lucide="circle-alert"></i><p>${esc(err.message||'Could not load EMI schedule.')}</p><button class="ghost-btn mt-4" onclick="resetEMILoan()"><i data-lucide="search"></i>Search another Loan ID</button></div>`);lucide.createIcons();
  }
}
function loadEMIByLoan(e){e.preventDefault();const id=e.target.querySelector('input').value.trim();if(!id)return;state.data.selectedLoanId=id;sessionStorage.setItem('finora_emi_loan_id',id);renderPage();}
function resetEMILoan(){sessionStorage.removeItem('finora_emi_loan_id');state.data.selectedLoanId=null;state.data.selectedEmiLoan=null;state.data.emi=[];state._emiPage=1;renderPage();}
function emiLoan(){return state.data.selectedEmiLoan||loanById(state.data.selectedLoanId);}
function emiRows(){return Array.isArray(state.data.emi)?state.data.emi:[];}
function emiIsOverdue(x){return String(x.status||'').toUpperCase()==='PENDING' && x.dueDate && new Date(`${x.dueDate}T23:59:59`) < new Date();}
function emiFilteredRows(){
  const rows=emiRows(), filter=document.getElementById('emi-status-filter')?.value||'ALL', from=document.getElementById('emi-from-date')?.value||'', to=document.getElementById('emi-to-date')?.value||'';
  return rows.filter(x=>{const st=String(x.status||'').toUpperCase();const okStatus=filter==='ALL'||(filter==='OVERDUE'?emiIsOverdue(x):st===filter);const d=x.dueDate||'';return okStatus&&(!from||d>=from)&&(!to||d<=to);});
}
function renderEMISchedulePage(c){
  const rows=emiRows(), loan=emiLoan(), customer=state.data.selectedEmiCustomer||`User #${loan?.userId??'—'}`;
  const total=rows.length, paidRows=rows.filter(x=>String(x.status||'').toUpperCase()==='PAID'), paid=paidRows.length, remaining=Math.max(total-paid,0);
  const totalPaid=paidRows.reduce((a,x)=>a+Number(x.paidAmount||x.emiAmount||0),0), outstanding=loan?Number(loan.outstandingAmount||Math.max(Number(loan.totalPayable||0)-totalPaid,0)):Math.max(rows.reduce((a,x)=>a+Number(x.emiAmount||0),0)-totalPaid,0);
  const pct=total?Math.min(100,(paid/total)*100):0;
  const pending=rows.filter(x=>String(x.status||'').toUpperCase()==='PENDING');
  const next=pending.slice().sort((a,b)=>new Date(a.dueDate)-new Date(b.dueDate))[0];
  const overdue=rows.filter(emiIsOverdue).length;
  state._emiPage=state._emiPage||1;
  c.innerHTML=moduleShell(`EMI Schedule · Loan #${esc(state.data.selectedLoanId)}`,'Track payments, outstanding balance and upcoming EMIs','calendar-clock','','',`
    <div class="emi-topbar"><form onsubmit="loadEMIByLoan(event)" class="emi-search-form"><div class="input-wrap"><i data-lucide="search"></i><input name="loanId" type="number" min="1" value="${esc(state.data.selectedLoanId)}" placeholder="Enter Loan ID" required></div><button class="primary-btn" type="submit"><i data-lucide="calendar-search"></i>View EMI Schedule</button></form><div class="flex gap-2"><button class="ghost-btn" onclick="resetEMILoan()"><i data-lucide="rotate-ccw"></i>Change Loan</button><button class="ghost-btn" onclick="refreshCurrent()"><i data-lucide="refresh-cw"></i>Refresh</button></div></div>
    <div class="emi-summary-head"><div><p class="text-xs uppercase tracking-widest text-slate-400">Customer / Loan Summary</p><h3 class="text-lg font-bold mt-1">${esc(customer)}</h3><p class="text-sm text-slate-500 mt-1">${esc(loan?.loanNumber||'Loan #'+state.data.selectedEmiLoan?.id||'')} · User #${esc(loan?.userId??'—')}</p></div>${status(loan?.status||'—')}</div>
    <div class="emi-loan-summary"><div><span>Loan Amount</span><strong>${money(loan?.loanAmount||0)}</strong></div><div><span>Monthly EMI</span><strong>${money(loan?.emiAmount||rows[0]?.emiAmount||0)}</strong></div><div><span>Total Payable</span><strong>${money(loan?.totalPayable||rows.reduce((a,x)=>a+Number(x.emiAmount||0),0))}</strong></div><div><span>Outstanding</span><strong>${money(outstanding)}</strong></div></div>
    ${overdue?`<div class="emi-alert"><i data-lucide="triangle-alert"></i><div><strong>${overdue} EMI payment${overdue>1?'s are':' is'} overdue</strong><p>Review the pending instalments below and record payment when received.</p></div></div>`:''}
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-5 mt-5">
      ${emiStat('calendar-days','Total EMI',total,'Scheduled installments')}${emiStat('circle-check','Paid EMI',paid,'Completed payments')}${emiStat('clock-3','Remaining EMI',remaining,'Pending installments')}${emiStat('indian-rupee','Total Paid',money(totalPaid),'Recorded payments')}${emiStat('wallet-cards','Outstanding',money(outstanding),'Current balance')}
    </div>
    <div class="data-card mt-5 p-5"><div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p class="text-xs uppercase tracking-widest text-slate-400">EMI Progress</p><p class="mt-1 font-bold">${paid} / ${total} EMI Paid</p></div><strong class="text-lg">${pct.toFixed(1)}%</strong></div><div class="emi-progress mt-3"><span style="width:${pct}%"></span></div><div class="mt-3 flex flex-wrap justify-between gap-3 text-xs text-slate-500"><span>${remaining} remaining</span><span>Paid amount ${money(totalPaid)}</span></div></div>
    <div class="data-card mt-5"><div class="p-5 border-b border-slate-100 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between"><div><h3 class="font-bold">EMI Schedule</h3><p class="text-xs text-slate-500 mt-1">${total} installment(s) for ${esc(loan?.loanNumber||'Loan #'+state.data.selectedEmiLoan?.id||'selected loan')}</p></div><div class="emi-filters"><select id="emi-status-filter" class="toolbar-select" onchange="state._emiPage=1;refreshEMITable()"><option value="ALL">All</option><option value="PENDING">Pending</option><option value="PAID">Paid</option><option value="OVERDUE">Overdue</option></select><input id="emi-from-date" type="date" onchange="state._emiPage=1;refreshEMITable()"><input id="emi-to-date" type="date" onchange="state._emiPage=1;refreshEMITable()"><button class="ghost-btn" onclick="resetEMIFilters()"><i data-lucide="filter-x"></i>Reset</button><button class="ghost-btn" onclick="exportEMIStatement()"><i data-lucide="file-spreadsheet"></i>Download Statement</button><button class="ghost-btn" onclick="printEMIStatement()"><i data-lucide="printer"></i>Print</button></div></div><div class="table-wrap"><table class="data-table emi-table"><thead><tr><th>EMI #</th><th>Due Date</th><th>Principal</th><th>Interest</th><th>EMI Amount</th><th>Paid</th><th>Status</th><th>Action</th></tr></thead><tbody id="emi-body"></tbody></table></div><div class="emi-pager"><span id="emi-page-info"></span><div id="emi-pagination" class="flex items-center gap-2"></div></div></div>
    ${next?`<div class="emi-next"><div class="mini-icon"><i data-lucide="calendar-clock"></i></div><div><p class="text-xs uppercase tracking-widest text-slate-400">Next EMI</p><p class="font-bold mt-1">EMI #${esc(next.emiNumber)} · ${date(next.dueDate)}</p><p class="text-sm text-slate-500 mt-1">Amount ${money(next.emiAmount)}</p></div><div class="ml-auto">${emiIsOverdue(next)?'<span class="badge bg-rose-50 text-rose-700">Overdue</span>':'<span class="badge bg-emerald-50 text-emerald-700">Upcoming</span>'}</div></div>`:''}
  `);
  refreshEMITable();lucide.createIcons();
}
function emiStat(icon,title,value,note){return `<div class="stat-card"><div class="mini-icon"><i data-lucide="${icon}"></i></div><p class="mt-4 text-xs font-semibold uppercase tracking-widest text-slate-400">${title}</p><p class="mt-1 text-xl font-bold">${value}</p><p class="mt-1 text-xs text-slate-500">${note}</p></div>`;}
function refreshEMITable(){const rows=emiFilteredRows(),size=Number(document.getElementById('emi-page-size')?.value||10);const totalPages=Math.max(1,Math.ceil(rows.length/size));if(state._emiPage>totalPages)state._emiPage=1;const start=(state._emiPage-1)*size,pageRows=rows.slice(start,start+size);const body=document.getElementById('emi-body');if(!body)return;body.innerHTML=pageRows.length?pageRows.map(x=>`<tr><td class="font-semibold">#${esc(x.emiNumber)}</td><td>${date(x.dueDate)}</td><td>${money(x.principalAmount)}</td><td>${money(x.interestAmount)}</td><td class="font-semibold">${money(x.emiAmount)}</td><td>${money(x.paidAmount)}</td><td>${emiIsOverdue(x)?'<span class="badge bg-rose-50 text-rose-700">OVERDUE</span>':status(x.status)}</td><td>${String(x.status||'').toUpperCase()!=='PAID'?`<button class="action-btn" onclick="openEMIPayment(${x.id})"><i data-lucide="circle-dollar-sign"></i>Pay EMI</button>`:'<span class="text-xs text-slate-400">Paid</span>'}</td></tr>`).join(''):`<tr><td colspan="8"><div class="empty"><i data-lucide="calendar-off"></i><p>No EMI records match the selected filters.</p></div></td></tr>`;const info=document.getElementById('emi-page-info');if(info)info.textContent=`Showing ${rows.length?start+1:0}-${Math.min(start+pageRows.length,rows.length)} of ${rows.length}`;const pager=document.getElementById('emi-pagination');if(pager)pager.innerHTML=`<select id="emi-page-size" class="toolbar-select" onchange="state._emiPage=1;refreshEMITable()"><option ${size===10?'selected':''}>10</option><option ${size===20?'selected':''}>20</option><option ${size===50?'selected':''}>50</option></select><button class="ghost-btn" ${state._emiPage<=1?'disabled':''} onclick="state._emiPage--;refreshEMITable()">Previous</button><span class="text-sm font-semibold text-slate-600">${state._emiPage} / ${totalPages}</span><button class="ghost-btn" ${state._emiPage>=totalPages?'disabled':''} onclick="state._emiPage++;refreshEMITable()">Next</button>`;lucide.createIcons();}
function resetEMIFilters(){['emi-status-filter','emi-from-date','emi-to-date'].forEach(id=>{const el=document.getElementById(id);if(el)el.value=id==='emi-status-filter'?'ALL':'';});state._emiPage=1;refreshEMITable();}
function openEMIPayment(id){const x=emiRows().find(r=>Number(r.id)===Number(id));const loan=emiLoan();if(!x)return;modal('Pay EMI',`<div class="emi-payment-card"><div class="mini-icon"><i data-lucide="circle-dollar-sign"></i></div><div><p class="text-xs uppercase tracking-widest text-slate-400">Loan ${esc(loan?.loanNumber||'—')}</p><h3 class="font-bold text-lg mt-1">EMI #${esc(x.emiNumber)}</h3></div></div><div class="emi-payment-grid"><div><span>Due Date</span><strong>${date(x.dueDate)}</strong></div><div><span>EMI Amount</span><strong>${money(x.emiAmount)}</strong></div><div><span>Current Outstanding</span><strong>${money(loan?.outstandingAmount||0)}</strong></div><div><span>Customer</span><strong>${esc(state.data.selectedEmiCustomer||'—')}</strong></div></div><form onsubmit="submitEMIPayment(event,${x.id})" class="mt-5"><label class="field-label">Payment Amount</label><div class="input-wrap"><i data-lucide="indian-rupee"></i><input name="amount" type="number" step="0.01" min="0.01" value="${Number(x.emiAmount||0)}" required></div><div class="flex justify-end gap-2 mt-5"><button type="button" class="ghost-btn" onclick="closeModal()">Cancel</button><button type="submit" class="primary-btn"><i data-lucide="check-circle-2"></i>Confirm Payment</button></div></form>`);}
async function submitEMIPayment(e,id){e.preventDefault();const amount=e.target.amount.value;if(!amount||Number(amount)<=0)return;try{const paid=await apiFetch(`/emi-schedules/${id}/pay?amount=${encodeURIComponent(amount)}`,{method:'POST'});closeModal();toast('EMI payment recorded');await emiPage(document.getElementById('content'));showEMIReceipt(paid||emiRows().find(x=>Number(x.id)===Number(id)));}catch(err){toast(err.message||'Unable to record EMI payment','error');}}
function showEMIReceipt(x){if(!x)return;const loan=emiLoan(),total=emiRows().length,paid=emiRows().filter(r=>String(r.status||'').toUpperCase()==='PAID').length,remaining=Math.max(total-paid,0);modal('EMI Payment Receipt',`<div id="emi-receipt" class="emi-receipt"><div class="emi-receipt-top"><div><p class="text-xs uppercase tracking-widest text-slate-400">Finora Finance</p><h2>EMI Payment Receipt</h2></div>${status(x.status||'PAID')}</div><div class="emi-receipt-amount"><span>Payment Amount</span><strong>${money(x.paidAmount||x.emiAmount)}</strong></div><div class="emi-receipt-grid">${[['Customer',state.data.selectedEmiCustomer||'—'],['Loan Number',loan?.loanNumber||`Loan #${loan?.id||x.loanId}`],['EMI Number',`#${x.emiNumber}`],['Payment Date',date(x.paymentDate)||date(new Date())],['Principal',money(x.principalAmount)],['Interest',money(x.interestAmount)],['Remaining EMI',remaining],['Outstanding',money(loan?.outstandingAmount||0)]].map(a=>`<div><span>${esc(a[0])}</span><strong>${esc(a[1])}</strong></div>`).join('')}</div></div><div class="flex flex-wrap justify-end gap-2 mt-4"><button class="ghost-btn" onclick="closeModal()">Close</button><button class="ghost-btn" onclick="downloadEMIReceipt(${x.id})"><i data-lucide="download"></i>Download</button><button class="ghost-btn" onclick="downloadEMIReceipt(${x.id})"><i data-lucide="image-down"></i>Save Image</button><button class="ghost-btn" onclick="shareEMIReceipt(${x.id})"><i data-lucide="share-2"></i>Share</button><button class="primary-btn" onclick="printEMIReceipt()"><i data-lucide="printer"></i>Print</button></div>`);}
function emiReceiptCanvas(id){const x=emiRows().find(r=>Number(r.id)===Number(id))||{};const loan=emiLoan();const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=900;const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,1200,900);ctx.fillStyle='#0f172a';ctx.font='700 38px Arial';ctx.fillText('FINORA FINANCE',70,75);ctx.font='700 30px Arial';ctx.fillText('EMI PAYMENT RECEIPT',70,120);ctx.font='700 34px Arial';ctx.fillText(`Payment: ${money(x.paidAmount||x.emiAmount)}`,70,200);const vals=[['Customer',state.data.selectedEmiCustomer||'—'],['Loan Number',loan?.loanNumber||`Loan #${loan?.id||x.loanId}`],['EMI Number',`#${x.emiNumber}`],['Payment Date',date(x.paymentDate)||date(new Date())],['Due Date',date(x.dueDate)],['Principal',money(x.principalAmount)],['Interest',money(x.interestAmount)],['Status',x.status||'PAID']];ctx.font='600 20px Arial';vals.forEach((v,i)=>{const col=i%2,row=Math.floor(i/2),xx=70+col*540,yy=290+row*95;ctx.fillStyle='#64748b';ctx.fillText(v[0],xx,yy);ctx.fillStyle='#0f172a';ctx.font='700 23px Arial';ctx.fillText(String(v[1]),xx,yy+32);ctx.font='600 20px Arial';});ctx.fillStyle='#94a3b8';ctx.font='16px Arial';ctx.fillText('System-generated EMI payment receipt.',70,830);return canvas;}
function downloadEMIReceipt(id){emiReceiptCanvas(id).toBlob(blob=>{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`Finora-EMI-Receipt-${id}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);},'image/png');}
async function shareEMIReceipt(id){const canvas=emiReceiptCanvas(id);canvas.toBlob(async blob=>{const file=new File([blob],`Finora-EMI-Receipt-${id}.png`,{type:'image/png'});if(navigator.share&&navigator.canShare?.({files:[file]})){try{await navigator.share({title:'Finora EMI Payment Receipt',files:[file]});}catch(e){} }else{downloadEMIReceipt(id);toast('Sharing is not supported here, so the receipt was downloaded.','info');}},'image/png');}
function printEMIReceipt(){const el=document.getElementById('emi-receipt');if(!el)return;const w=window.open('','_blank','width=900,height=700');w.document.write(`<html><head><title>Finora EMI Receipt</title><style>body{font-family:Arial,sans-serif;padding:30px;color:#0f172a}.emi-receipt{max-width:760px;margin:auto;border:1px solid #e2e8f0;border-radius:20px;padding:28px}.emi-receipt-top{display:flex;justify-content:space-between}.emi-receipt-top h2{font-size:24px;margin-top:5px}.emi-receipt-amount{margin:25px 0;padding:20px;border-radius:16px;background:#f8fafc}.emi-receipt-amount span,.emi-receipt-grid span{display:block;color:#64748b;font-size:12px}.emi-receipt-amount strong{display:block;font-size:30px;margin-top:5px}.emi-receipt-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.emi-receipt-grid div{border:1px solid #e2e8f0;padding:14px;border-radius:12px}.emi-receipt-grid strong{display:block;margin-top:5px}</style></head><body>${el.outerHTML}</body></html>`);w.document.close();w.focus();w.print();}
function exportEMIStatement(){const rows=emiFilteredRows();if(!rows.length){toast('No EMI records to download','info');return;}const header=['EMI Number','Due Date','Principal','Interest','EMI Amount','Paid Amount','Payment Date','Status'];const q=v=>'"'+String(v??'').replace(/"/g,'""')+'"';const csv=[header,...rows.map(x=>[x.emiNumber,x.dueDate,x.principalAmount,x.interestAmount,x.emiAmount,x.paidAmount,x.paymentDate,emiIsOverdue(x)?'OVERDUE':x.status])].map(r=>r.map(q).join(',')).join('\r\n');const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`Finora-EMI-Statement-Loan-${state.data.selectedLoanId}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('EMI statement downloaded');}
function printEMIStatement(){const rows=emiFilteredRows(),loan=emiLoan();if(!rows.length){toast('No EMI records to print','info');return;}const w=window.open('','_blank','width=1000,height=750');w.document.write(`<html><head><title>Finora EMI Statement</title><style>body{font-family:Arial;padding:28px;color:#0f172a}h1{margin:0}p{color:#64748b}.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:20px 0}.summary div{border:1px solid #ddd;border-radius:10px;padding:10px}.summary span{display:block;color:#64748b;font-size:11px}.summary strong{display:block;margin-top:4px}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{padding:9px;border:1px solid #ddd;text-align:left;font-size:12px}th{background:#f8fafc}</style></head><body><h1>FINORA FINANCE</h1><p>EMI Statement · ${esc(loan?.loanNumber||`Loan #${state.data.selectedEmiLoan?.id||state.data.selectedLoanId}`)} · ${esc(state.data.selectedEmiCustomer||'')}</p><div class="summary"><div><span>Loan Amount</span><strong>${money(loan?.loanAmount||0)}</strong></div><div><span>EMI</span><strong>${money(loan?.emiAmount||0)}</strong></div><div><span>Outstanding</span><strong>${money(loan?.outstandingAmount||0)}</strong></div><div><span>Records</span><strong>${rows.length}</strong></div></div><table><thead><tr><th>EMI #</th><th>Due Date</th><th>Principal</th><th>Interest</th><th>EMI Amount</th><th>Paid</th><th>Payment Date</th><th>Status</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${esc(x.emiNumber)}</td><td>${date(x.dueDate)}</td><td>${money(x.principalAmount)}</td><td>${money(x.interestAmount)}</td><td>${money(x.emiAmount)}</td><td>${money(x.paidAmount)}</td><td>${date(x.paymentDate)}</td><td>${esc(emiIsOverdue(x)?'OVERDUE':x.status)}</td></tr>`).join('')}</tbody></table></body></html>`);w.document.close();w.focus();w.print();}

async function profile(c) {
  try {
    const user = await apiFetch(`/users/email/${encodeURIComponent(state.email)}`);
    state.data.profile = user;
    renderProfileView(c, user);
  } catch (err) {
    c.innerHTML = `<div class="data-card p-8 text-center"><div class="mini-icon mx-auto mb-4"><i data-lucide="circle-alert"></i></div><h3 class="font-bold">Could not load profile</h3><p class="mt-2 text-sm text-slate-500">${esc(err.message)}</p><button class="ghost-btn mt-5" onclick="refreshCurrent()"><i data-lucide="refresh-cw"></i> Try again</button></div>`;
    lucide.createIcons();
  }
}

function renderProfileView(c,user){
  const userName=user.name||'User', userEmail=user.email||state.email||'—', userMobile=user.mobile||'—', userAddress=user.address||'—', userGender=user.gender||'—', userRole=user.role||state.role||'CUSTOMER';
  c.innerHTML=`
    <div class="profile-page">
      <div class="profile-intro"><div><p class="eyebrow">Account</p><h2 class="mt-1 text-2xl font-bold">My Profile</h2><p class="mt-1 text-sm text-slate-500">Manage your personal information and account details.</p></div><button class="primary-btn" onclick="openProfileEdit()"><i data-lucide="pencil"></i>Edit Profile</button></div>
      <div class="profile-hero data-card">
        <div class="profile-hero-main"><div class="profile-avatar">${initials(userName)}</div><div><h3>${esc(userName)}</h3><p>${esc(userEmail)}</p><div class="mt-2">${status(userRole)}</div></div></div>
        <div class="profile-id"><span>User ID</span><strong>#${esc(user.id)}</strong></div>
      </div>
      <div class="profile-grid">
        <section class="data-card profile-section"><div class="profile-section-head"><div class="mini-icon"><i data-lucide="user-round"></i></div><div><h3>Personal Information</h3><p>Your registered contact details.</p></div></div><div class="profile-fields">
          <div class="profile-field"><span>Full Name</span><strong>${esc(userName)}</strong></div><div class="profile-field"><span>Mobile Number</span><strong>${esc(userMobile)}</strong></div><div class="profile-field"><span>Email Address</span><strong class="break-all">${esc(userEmail)}</strong></div><div class="profile-field"><span>Gender</span><strong>${esc(userGender)}</strong></div><div class="profile-field full"><span>Address</span><strong>${esc(userAddress)}</strong></div>
        </div></section>
        <section class="data-card profile-section"><div class="profile-section-head"><div class="mini-icon"><i data-lucide="shield-check"></i></div><div><h3>Account & Security</h3><p>Access and authentication information.</p></div></div><div class="profile-fields">
          <div class="profile-field"><span>Access Role</span><strong>${status(userRole)}</strong></div><div class="profile-field"><span>User ID</span><strong>#${esc(user.id)}</strong></div><div class="profile-field"><span>Authentication</span><strong>JWT / Stateless</strong></div><div class="profile-field"><span>Password</span><strong>••••••••</strong></div>
        </div><div class="profile-security-actions"><button class="ghost-btn" onclick="openChangePassword()"><i data-lucide="key-round"></i>Change Password</button><button class="ghost-btn text-rose-600" onclick="logout()"><i data-lucide="log-out"></i>Sign out</button></div></section>
      </div>
    </div>`;
  lucide.createIcons();
}

function openProfileEdit(){
  const u=state.data.profile||{};
  modal('Edit Profile',`<form onsubmit="submitProfileEdit(event,${Number(u.id)})" class="profile-edit-form"><div class="profile-edit-note"><i data-lucide="info"></i><span>Update your personal details. Your role cannot be changed from My Profile.</span></div><div class="form-grid">
    <div><label class="field-label">Full Name</label><div class="input-wrap"><i data-lucide="user"></i><input name="name" value="${esc(u.name)}" minlength="2" required></div></div>
    <div><label class="field-label">Mobile Number</label><div class="input-wrap"><i data-lucide="phone"></i><input name="mobile" value="${esc(u.mobile)}" inputmode="numeric" maxlength="10" pattern="[0-9]{10}" required></div></div>
    <div><label class="field-label">Email Address</label><div class="input-wrap"><i data-lucide="mail"></i><input name="email" type="email" value="${esc(u.email)}" required></div></div>
    <div><label class="field-label">Gender</label><div class="input-wrap"><i data-lucide="users"></i><select name="gender" required><option value="">Select gender</option><option ${u.gender==='Male'?'selected':''}>Male</option><option ${u.gender==='Female'?'selected':''}>Female</option><option ${u.gender==='Other'?'selected':''}>Other</option></select></div></div>
    <div class="full"><label class="field-label">Address</label><div class="input-wrap"><i data-lucide="map-pin"></i><textarea name="address" rows="3" required>${esc(u.address)}</textarea></div></div>
  </div><div class="flex justify-end gap-2 mt-6"><button type="button" class="ghost-btn" onclick="closeModal()">Cancel</button><button type="submit" class="primary-btn"><i data-lucide="save"></i>Save Changes</button></div></form>`);
}

async function submitProfileEdit(e,id){
  e.preventDefault();
  const form=e.target, btn=form.querySelector('button[type="submit"]');
  const obj=Object.fromEntries(new FormData(form).entries());
  obj.name=obj.name.trim(); obj.email=obj.email.trim(); obj.mobile=obj.mobile.trim(); obj.address=obj.address.trim();
  if(obj.name.length<2){toast('Please enter a valid name','error');return;}
  if(!/^[0-9]{10}$/.test(obj.mobile)){toast('Mobile number must contain exactly 10 digits','error');return;}
  btn.disabled=true; const old=btn.innerHTML; btn.innerHTML='<i data-lucide="loader-circle" class="animate-spin"></i>Saving...'; lucide.createIcons();
  try{
    const updated=await apiFetch(`/users/${id}`,{method:'PATCH',body:JSON.stringify(obj)});
    state.data.profile=updated; state.email=updated.email; localStorage.setItem('finora_email',updated.email); closeModal(); setupUser(); renderProfileView(document.getElementById('content'),updated); toast('Profile updated successfully');
  }catch(err){toast(err.message||'Unable to update profile','error');}finally{btn.disabled=false;btn.innerHTML=old;lucide.createIcons();}
}

function openChangePassword(){
  const u=state.data.profile||{};
  modal('Change Password',`<form onsubmit="submitChangePassword(event,${Number(u.id)})"><div class="profile-edit-note"><i data-lucide="shield-check"></i><span>For security, your current password will be verified before the new password is saved.</span></div><div class="mt-5"><label class="field-label">Current Password</label><div class="input-wrap"><i data-lucide="lock-keyhole"></i><input name="currentPassword" type="password" minlength="4" required></div></div><div class="mt-4"><label class="field-label">New Password</label><div class="input-wrap"><i data-lucide="key-round"></i><input name="newPassword" type="password" minlength="6" required></div></div><div class="mt-4"><label class="field-label">Confirm New Password</label><div class="input-wrap"><i data-lucide="key-round"></i><input name="confirmPassword" type="password" minlength="6" required></div></div><div class="flex justify-end gap-2 mt-6"><button type="button" class="ghost-btn" onclick="closeModal()">Cancel</button><button type="submit" class="primary-btn"><i data-lucide="shield-check"></i>Update Password</button></div></form>`);
}

async function submitChangePassword(e,id){
  e.preventDefault(); const f=e.target, btn=f.querySelector('button[type="submit"]'); const current=f.currentPassword.value, next=f.newPassword.value, confirm=f.confirmPassword.value;
  if(next!==confirm){toast('New password and confirmation do not match','error');return;}
  if(next.length<6){toast('New password must contain at least 6 characters','error');return;}
  btn.disabled=true; const old=btn.innerHTML; btn.innerHTML='<i data-lucide="loader-circle" class="animate-spin"></i>Updating...'; lucide.createIcons();
  try{
    await apiFetch('/auth/login',{method:'POST',body:JSON.stringify({email:state.email,password:current})});
    await apiFetch(`/users/${id}`,{method:'PATCH',body:JSON.stringify({password:next})});
    closeModal(); toast('Password updated successfully');
  }catch(err){toast(err.message==='Bad credentials'?'Current password is incorrect':(err.message||'Unable to update password'),'error');}finally{btn.disabled=false;btn.innerHTML=old;lucide.createIcons();}
}

function modal(title,body){document.getElementById('modal-root').innerHTML=`<div class="modal-backdrop" onclick="if(event.target===this)closeModal()"><div class="modal"><div class="modal-head"><h3 class="font-bold text-lg">${title}</h3><button class="close-btn" onclick="closeModal()"><i data-lucide="x"></i></button></div><div class="modal-body">${body}</div></div></div>`;lucide.createIcons();}
function closeModal(){document.getElementById('modal-root').innerHTML='';}
function fieldHtml(f,v=''){const [name,label,type,opts]=f;if(type==='select')return `<div><label class="field-label">${label}</label><div class="input-wrap"><i data-lucide="list-filter"></i><select name="${name}" required><option value="">${placeholderFor(name)}</option>${opts.split(',').map(o=>`<option ${String(v)===o?'selected':''}>${o}</option>`).join('')}</select></div></div>`;return `<div class="${name==='description'||name==='purpose'?'full':''}"><label class="field-label">${label}</label><div class="input-wrap"><i data-lucide="${type==='number'?'hash':name.toLowerCase().includes('amount')?'indian-rupee':'circle-dot'}"></i><input name="${name}" type="${type}" value="${esc(v)}" placeholder="${placeholderFor(name)}" ${type==='number'?'step="0.01" min="0"':''} required></div></div>`;}
function openSavingCreateForm(){
  const users=Array.isArray(state._savingUsers)&&state._savingUsers.length?state._savingUsers:(Array.isArray(state.data.users)?state.data.users:[]);
  if(!users.length){toast('No customers are available to create an account.','error');return;}
  state._savingCreateUsers=users;
  const options=users.map(u=>`<option value="${esc(u.id)}">${esc(u.name||u.fullName||u.customerName||`User #${u.id}`)} — User #${esc(u.id)}${u.email?` · ${esc(u.email)}`:''}</option>`).join('');
  modal('Create Savings Account',`<form onsubmit="submitSavingCreateForm(event)" class="saving-create-form">
    <div class="saving-create-intro"><div class="mini-icon"><i data-lucide="wallet-cards"></i></div><div><p class="text-xs uppercase tracking-widest text-slate-400">Account opening</p><h3>Create a new savings account</h3><p>Select a customer and enter the opening account details.</p></div></div>
    <div class="saving-create-section"><div class="saving-create-section-title"><span>1</span><div><strong>Customer</strong><small>Customer details are filled from the existing Users API.</small></div></div>
      <div class="form-grid">
        <div class="full"><label class="field-label">Select Customer <span class="saving-required">*</span></label><div class="input-wrap"><i data-lucide="user-round"></i><select id="saving-create-user" name="userId" required onchange="syncSavingCustomerDetails(this.value)"><option value="">Choose a customer</option>${options}</select></div></div>
        <div><label class="field-label">Customer Name</label><div class="input-wrap"><i data-lucide="badge"></i><input id="saving-create-name" name="accountHolderName" readonly placeholder="Customer name"></div></div>
        <div><label class="field-label">Email</label><div class="input-wrap"><i data-lucide="mail"></i><input id="saving-create-email" name="email" type="email" readonly placeholder="Customer email"></div></div>
        <div><label class="field-label">Mobile</label><div class="input-wrap"><i data-lucide="phone"></i><input id="saving-create-mobile" name="mobile" readonly placeholder="Customer mobile"></div></div>
        <div><label class="field-label">Address</label><div class="input-wrap"><i data-lucide="map-pin"></i><input id="saving-create-address" name="address" readonly placeholder="Customer address"></div></div>
      </div>
    </div>
    <div class="saving-create-section"><div class="saving-create-section-title"><span>2</span><div><strong>Account details</strong><small>Account number is generated by the existing backend.</small></div></div>
      <div class="form-grid">
        <div><label class="field-label">Account Type <span class="saving-required">*</span></label><div class="input-wrap"><i data-lucide="landmark"></i><select name="accountType" required><option value="SAVINGS" selected>Savings</option><option value="CURRENT">Current</option></select></div></div>
        <div><label class="field-label">Opening Balance <span class="saving-required">*</span></label><div class="input-wrap"><i data-lucide="indian-rupee"></i><input id="saving-create-balance" name="balance" type="number" min="0.01" step="0.01" required placeholder="Enter opening balance" oninput="updateSavingCreatePreview()"></div><p id="saving-create-balance-error" class="saving-field-error"></p></div>
        <div class="full"><div class="saving-status-card"><div><span>Status</span><strong>ACTIVE</strong><small>New accounts are opened as active.</small></div><i data-lucide="circle-check"></i></div></div>
      </div>
    </div>
    <div class="saving-create-section"><div class="saving-create-section-title"><span>3</span><div><strong>KYC documents</strong><small>Optional local attachments for this frontend form. They are not uploaded to the backend.</small></div></div>
      <div class="saving-kyc-grid">
        <div class="saving-file-card"><div><strong>Identity Proof</strong><small>Aadhaar, PAN, Passport or Driving License</small></div><label class="saving-upload-btn"><i data-lucide="upload"></i>Choose file<input type="file" accept=".pdf,.jpg,.jpeg,.png" onchange="handleSavingKycFile(this,'identity')"></label><div id="saving-file-identity" class="saving-file-result"></div></div>
        <div class="saving-file-card"><div><strong>Address Proof</strong><small>Aadhaar, Voter ID, Passport or Utility Bill</small></div><label class="saving-upload-btn"><i data-lucide="upload"></i>Choose file<input type="file" accept=".pdf,.jpg,.jpeg,.png" onchange="handleSavingKycFile(this,'address')"></label><div id="saving-file-address" class="saving-file-result"></div></div>
        <div class="saving-file-card full"><div><strong>Passport Photo</strong><small>JPG or PNG image</small></div><label class="saving-upload-btn"><i data-lucide="image"></i>Choose photo<input type="file" accept=".jpg,.jpeg,.png" onchange="handleSavingKycFile(this,'photo')"></label><div id="saving-file-photo" class="saving-file-result"></div></div>
      </div>
    </div>
    <div class="saving-create-section"><div class="saving-create-section-title"><span>4</span><div><strong>Account preview</strong><small>Review the information before creating the account.</small></div></div>
      <div class="saving-create-preview"><div><span>Customer</span><strong id="saving-preview-customer">—</strong></div><div><span>Account Type</span><strong id="saving-preview-type">SAVINGS</strong></div><div><span>Opening Balance</span><strong id="saving-preview-balance">₹0.00</strong></div><div><span>Status</span><strong>ACTIVE</strong></div><div class="full"><span>Account Number</span><strong>Generated automatically after creation</strong></div></div>
    </div>
    <div class="saving-create-note"><i data-lucide="shield-check"></i><span>Your account details are submitted through the existing Saving Account API. KYC files selected above stay local to this form.</span></div>
    <div class="flex justify-end gap-2 pt-1"><button type="button" class="ghost-btn" onclick="closeModal()">Cancel</button><button id="saving-create-submit" class="primary-btn" type="submit"><i data-lucide="save"></i>Create Account</button></div>
  </form>`);
  syncSavingCustomerDetails('');
}
function syncSavingCustomerDetails(userId){
  const u=(state._savingCreateUsers||[]).find(x=>String(x.id)===String(userId));
  const set=(id,val)=>{const el=document.getElementById(id);if(el)el.value=val||'';};
  set('saving-create-name',u?.name||u?.fullName||u?.customerName||'');
  set('saving-create-email',u?.email||'');
  set('saving-create-mobile',u?.mobile||'');
  set('saving-create-address',u?.address||'');
  const preview=document.getElementById('saving-preview-customer'); if(preview)preview.textContent=u?(u.name||u.fullName||u.customerName||`User #${u.id}`):'—';
  updateSavingCreatePreview(); lucide.createIcons();
}
function updateSavingCreatePreview(){
  const balance=Number(document.getElementById('saving-create-balance')?.value||0);
  const type=document.querySelector('.saving-create-form select[name="accountType"]')?.value||'SAVINGS';
  const b=document.getElementById('saving-preview-balance'); if(b)b.textContent=money(balance);
  const t=document.getElementById('saving-preview-type'); if(t)t.textContent=type;
  const e=document.getElementById('saving-create-balance-error'); if(e)e.textContent=balance<=0?'Opening balance must be greater than ₹0.':'';
}
function handleSavingKycFile(input,kind){
  const file=input?.files?.[0],root=document.getElementById(`saving-file-${kind}`); if(!root)return;
  if(!file){root.innerHTML='';return;}
  const allowed=kind==='photo'?['image/jpeg','image/png']:['application/pdf','image/jpeg','image/png'];
  if(!allowed.includes(file.type)){input.value='';root.innerHTML='<span class="saving-file-error">Please choose a PDF, JPG or PNG file.</span>';return;}
  if(file.size>5*1024*1024){input.value='';root.innerHTML='<span class="saving-file-error">File must be 5 MB or smaller.</span>';return;}
  const size=file.size<1024*1024?`${(file.size/1024).toFixed(0)} KB`:`${(file.size/1024/1024).toFixed(1)} MB`;
  const isImage=file.type.startsWith('image/');
  root.innerHTML=`<div class="saving-file-chip">${isImage?`<img src="${URL.createObjectURL(file)}" alt="Preview">`:'<span class="saving-file-icon"><i data-lucide="file-text"></i></span>'}<div><strong>${esc(file.name)}</strong><small>${size}</small></div><button type="button" title="Remove" onclick="removeSavingKycFile('${kind}')"><i data-lucide="x"></i></button></div>`;
  lucide.createIcons();
}
function removeSavingKycFile(kind){const input=document.querySelector(`.saving-create-form input[type="file"][onchange*="'${kind}'"]`);if(input)input.value='';const root=document.getElementById(`saving-file-${kind}`);if(root)root.innerHTML='';}
function generateSavingAccountNumber(){
  const existing=new Set((state.data.savings||[]).map(x=>String(x.accountNumber||'').trim()).filter(Boolean));
  let candidate='';
  do{
    candidate='SBI'+String(Math.floor(Math.random()*10000000000)).padStart(10,'0');
  }while(existing.has(candidate));
  return candidate;
}

async function submitSavingCreateForm(e){
  e.preventDefault();
  const form=e.target, userId=Number(form.userId.value), balance=Number(form.balance.value), user=(state._savingCreateUsers||[]).find(x=>Number(x.id)===userId);
  if(!userId||!user){toast('Please select a customer.','error');return;}
  if(!Number.isFinite(balance)||balance<=0){toast('Opening balance must be greater than ₹0.','error');return;}
  const button=document.getElementById('saving-create-submit');
  if(button){button.disabled=true;button.innerHTML='<i data-lucide="loader-circle"></i>Creating Account...';lucide.createIcons();}

  // The current SavingAccount backend requires an accountNumber and only
  // accepts fields that exist on the SavingAccount entity. Customer contact
  // details remain visible in the UI but are not sent to this API.
  const existingAccount=(state.data.savings||[]).find(x=>String(x.userId)===String(userId));
  if(existingAccount){
    if(button){button.disabled=false;button.innerHTML='<i data-lucide="save"></i>Create Account';lucide.createIcons();}
    closeModal();
    modal('Account Already Exists',`<div class="saving-create-success"><div class="saving-success-icon"><i data-lucide="info"></i></div><p class="text-xs uppercase tracking-widest text-slate-400">Finora Finance</p><h3>This customer already has a saving account</h3><div class="saving-create-success-grid"><div><span>Customer</span><strong>${esc(user?.name||user?.fullName||user?.customerName||`User #${userId}`)}</strong></div><div><span>Account Number</span><strong>${esc(existingAccount.accountNumber||'—')}</strong></div><div><span>Account Type</span><strong>${esc(existingAccount.accountType||'SAVINGS')}</strong></div><div><span>Balance</span><strong>${money(existingAccount.balance||0)}</strong></div><div><span>Status</span><strong>${esc(existingAccount.status||'—')}</strong></div></div></div><div class="flex justify-end gap-2 mt-5"><button class="ghost-btn" onclick="closeModal()">Close</button><button class="primary-btn" onclick="closeModal();viewSavingAccount(${Number(existingAccount.id||0)})"><i data-lucide="eye"></i>View Account</button></div>`);
    return;
  }
  const accountNumber=generateSavingAccountNumber();
  const obj={accountNumber,userId,accountType:form.accountType.value,balance,status:'ACTIVE'};
  try{
    const saved=await apiFetch('/savings',{method:'POST',body:JSON.stringify(obj)});
    closeModal(); await renderPage(); showSavingCreateSuccess(saved,user);
  }catch(err){
    if(String(err.message||'').toLowerCase().includes('permission') || String(err.message||'').includes('403')) toast('You do not have permission to create a saving account. Please check your login session and backend access.','error');
    else toast(err.message||'Unable to create savings account.','error');
    if(button){button.disabled=false;button.innerHTML='<i data-lucide="save"></i>Create Account';lucide.createIcons();}
  }
}
function showSavingCreateSuccess(account,user){
  const holder=account?.accountHolderName||user?.name||user?.fullName||user?.customerName||`User #${account?.userId??user?.id??'—'}`;
  modal('Account Created Successfully',`<div class="saving-create-success"><div class="saving-success-icon"><i data-lucide="check"></i></div><p class="text-xs uppercase tracking-widest text-slate-400">Finora Finance</p><h3>New savings account is ready</h3><div class="saving-create-success-grid"><div><span>Customer</span><strong>${esc(holder)}</strong></div><div><span>Account Number</span><strong>${esc(account?.accountNumber||'—')}</strong></div><div><span>Account Type</span><strong>${esc(account?.accountType||'SAVINGS')}</strong></div><div><span>Opening Balance</span><strong>${money(account?.balance||0)}</strong></div><div><span>Status</span><strong>${esc(account?.status||'ACTIVE')}</strong></div></div></div><div class="flex justify-end gap-2 mt-5"><button class="ghost-btn" onclick="closeModal()">Close</button><button class="primary-btn" onclick="closeModal();viewSavingAccount(${Number(account?.id||0)})"><i data-lucide="eye"></i>View Account</button></div>`);
}
function openGenericForm(key,row=null){const cfg=CONFIG[key];if(!cfg.create)return;const title=row?`Edit ${cfg.title.replace(/s$/,'')}`:cfg.create;const fields=cfg.fields.map(f=>fieldHtml(f,row?.[f[0]]??'')).join('');modal(title,`<form onsubmit="submitGeneric(event,'${key}',${row?.id||'null'})" class="space-y-5"><div class="form-grid">${fields}</div><div class="flex justify-end gap-2 pt-2"><button type="button" class="ghost-btn" onclick="closeModal()">Cancel</button><button class="primary-btn" type="submit"><i data-lucide="save"></i>${row?'Save changes':'Create record'}</button></div></form>`);}
async function submitGeneric(e,key,id){
  e.preventDefault();
  if(key==='transactions' && !id)return submitTransaction(e);
  const cfg=CONFIG[key];
  const obj=Object.fromEntries(new FormData(e.target).entries());
  for(const k of Object.keys(obj)){if(obj[k]==='')delete obj[k];else if(['userId','balance','depositAmount','tenureMonths','interestRate','monthlyInstallment','loanAmount'].includes(k))obj[k]=Number(obj[k]);}
  try{await apiFetch(id?`${cfg.endpoint}/${id}`:cfg.endpoint,{method:id?'PUT':'POST',body:JSON.stringify(obj)});closeModal();toast(id?'Record updated successfully':'Record created successfully');renderPage();}catch(err){toast(err.message,'error');}
}
async function submitTransaction(e){
  const obj=Object.fromEntries(new FormData(e.target).entries());
  if(obj.savingAccountId)obj.savingAccountId=Number(obj.savingAccountId);
  if(obj.amount)obj.amount=Number(obj.amount);
  try{
    const tx=await apiFetch('/transactions',{method:'POST',body:JSON.stringify(obj)});
    const type=String(tx?.type||obj.type||'TRANSACTION').toUpperCase();
    const amount=Number(tx?.amount||obj.amount||0);
    const ref=tx?.transactionReference||'Generated by system';
    const balance=tx?.balanceAfterTransaction;
    closeModal();
    toast(type==='DEPOSIT'?'Money credited successfully.':'Money debited successfully.','success');
    showTransactionSuccess(tx||{...obj,type,amount,transactionReference:ref,balanceAfterTransaction:balance});
    renderPage();
  }catch(err){toast(err.message,'error');}
}
function showTransactionSuccess(tx){
  const type=String(tx?.type||'TRANSACTION').toUpperCase();
  const isCredit=type==='DEPOSIT';
  const label=isCredit?'Money Credited':'Money Debited';
  const icon=isCredit?'arrow-down-left':'arrow-up-right';
  const amount=money(tx?.amount||0);
  const ref=tx?.transactionReference||'—';
  const balance=tx?.balanceAfterTransaction==null?'—':money(tx.balanceAfterTransaction);
  modal('Transaction Successful',`<div class="py-2 text-center">
    <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full ${isCredit?'bg-emerald-50 text-emerald-600':'bg-sky-50 text-sky-600'}"><i data-lucide="${icon}" class="h-8 w-8"></i></div>
    <h3 class="mt-4 text-2xl font-bold text-slate-900">${label}</h3>
    <p class="mt-1 text-sm text-slate-500">Your transaction has been completed successfully.</p>
    <div class="mx-auto mt-5 max-w-sm rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left">
      <div class="flex items-center justify-between border-b border-slate-200 pb-3"><span class="text-sm text-slate-500">Amount</span><span class="text-xl font-bold ${isCredit?'text-emerald-600':'text-slate-900'}">${isCredit?'+':'−'}${amount.replace('₹','₹')}</span></div>
      <div class="mt-3 flex justify-between gap-4 text-sm"><span class="text-slate-500">Transaction Type</span><span class="font-semibold">${esc(isCredit?'Deposit':'Withdrawal')}</span></div>
      <div class="mt-2 flex justify-between gap-4 text-sm"><span class="text-slate-500">Reference</span><span class="font-semibold">${esc(ref)}</span></div>
      <div class="mt-2 flex justify-between gap-4 text-sm"><span class="text-slate-500">Balance After</span><span class="font-semibold">${esc(balance)}</span></div>
    </div>
    <div class="mt-5 flex flex-wrap justify-center gap-2"><button class="ghost-btn" onclick="closeModal()">Done</button>${tx?.id?`<button class="primary-btn" onclick="closeModal();viewTransaction(${Number(tx.id)})"><i data-lucide="receipt-text"></i>View Payment Slip</button>`:''}</div>
  </div>`);
  lucide.createIcons();
}

function openUserForm(row=null){modal(row?'Edit user':'Create user',`<form onsubmit="submitUser(event,${row?.id||'null'})" class="space-y-5"><div class="form-grid">${[['name','Full name','text'],['email','Email','email'],['mobile','Mobile','text'],['password','Password','password'],['gender','Gender','text'],['role','Role','select','CUSTOMER,ADMIN'],['address','Address','text']].map(f=>fieldHtml(f,row?.[f[0]]??'')).join('')}</div><p class="text-xs text-slate-400">For an existing user, leave password blank if you do not want to change it.</p><div class="flex justify-end gap-2"><button type="button" class="ghost-btn" onclick="closeModal()">Cancel</button><button class="primary-btn" type="submit"><i data-lucide="save"></i>Save user</button></div></form>`);}
async function submitUser(e,id){e.preventDefault();const obj=Object.fromEntries(new FormData(e.target).entries());if(!obj.password)delete obj.password;try{await apiFetch(id?`/users/${id}`:'/users',{method:id?'PUT':'POST',body:JSON.stringify(obj)});closeModal();toast(id?'User updated':'User created');renderPage();}catch(err){toast(err.message,'error');}}
async function deleteRecord(key,id){if(!confirm('Are you sure you want to delete this record?'))return;const endpoint=key==='users'?'/users':CONFIG[key].endpoint;try{await apiFetch(`${endpoint}/${id}`,{method:'DELETE'});toast('Record deleted successfully');renderPage();}catch(err){toast(err.message,'error');}}
async function loanAction(id,action){try{await apiFetch(`/loans/${id}/${action}`,{method:'PATCH'});toast(`Loan ${action} successful`);renderPage();}catch(err){toast(err.message,'error');}}
async function generateEMI(id){try{const rows=await apiFetch(`/emi-schedules/generate/${id}`,{method:'POST'});state.data.emi=rows;state.data.selectedLoanId=id;sessionStorage.setItem('finora_emi_loan_id',String(id));toast('EMI schedule generated successfully');navigate('emi');}catch(err){toast(err.message,'error');}}
async function payEMI(id,defaultAmount){const amount=prompt(`Enter payment amount (EMI: ${money(defaultAmount)})`,defaultAmount);if(amount===null)return;try{await apiFetch(`/emi-schedules/${id}/pay?amount=${encodeURIComponent(amount)}`,{method:'POST'});toast('EMI payment recorded');renderPage();}catch(err){toast(err.message,'error');}}
async function payRD(id){const amount=prompt('Enter installment amount');if(amount===null)return;try{await apiFetch(`/rd/${id}/installment?amount=${encodeURIComponent(amount)}`,{method:'POST'});toast('RD installment recorded');renderPage();}catch(err){toast(err.message,'error');}}

document.getElementById('login-form').addEventListener('submit',async e=>{e.preventDefault();const btn=e.target.querySelector('button[type=submit]');const old=btn.innerHTML;btn.disabled=true;btn.innerHTML='<i data-lucide="loader-circle" class="animate-spin"></i> Signing in...';lucide.createIcons();try{const res=await apiFetch('/auth/login',{method:'POST',body:JSON.stringify({email:document.getElementById('login-email').value,password:document.getElementById('login-password').value})});saveAuth(res);document.getElementById('auth-screen').classList.add('hidden');document.getElementById('app-screen').classList.remove('hidden');setupUser();renderNav();navigate('dashboard');toast('Welcome back to Finora');}catch(err){toast(err.message,'error');}finally{btn.disabled=false;btn.innerHTML=old;lucide.createIcons();}});

const apiNote=document.getElementById('api-target-note');if(apiNote)apiNote.textContent=`Connecting to API: ${API}`;
if(state.token){document.getElementById('auth-screen').classList.add('hidden');document.getElementById('app-screen').classList.remove('hidden');setupUser();renderNav();navigate('dashboard');}
lucide.createIcons();


function showRegister(){
  document.getElementById('login-panel').classList.add('hidden');
  document.getElementById('register-panel').classList.remove('hidden');
  document.querySelector('#register-name')?.focus();
}
function showLogin(){
  document.getElementById('register-panel').classList.add('hidden');
  document.getElementById('login-panel').classList.remove('hidden');
  document.getElementById('login-email')?.focus();
}
document.getElementById('register-form')?.addEventListener('submit',async e=>{
  e.preventDefault();
  const btn=document.getElementById('register-submit');
  const password=document.getElementById('register-password').value;
  const confirmPassword=document.getElementById('register-confirm-password').value;
  if(password!==confirmPassword){toast('Passwords do not match','error');return;}
  const mobile=document.getElementById('register-mobile').value.trim();
  if(!/^\d{10}$/.test(mobile)){toast('Please enter a valid 10-digit mobile number','error');return;}
  const old=btn.innerHTML; btn.disabled=true;
  btn.innerHTML='<i data-lucide="loader-circle" class="animate-spin"></i> Creating account...'; lucide.createIcons();
  const payload={
    name:document.getElementById('register-name').value.trim(),
    mobile:mobile,
    email:document.getElementById('register-email').value.trim(),
    password:password,
    gender:document.getElementById('register-gender').value,
    address:document.getElementById('register-address').value.trim(),
    role:'CUSTOMER'
  };
  try{
    await apiFetch('/users',{method:'POST',body:JSON.stringify(payload)});
    toast('Registration successful. Please sign in.','success');
    document.getElementById('register-form').reset();
    showLogin();
    document.getElementById('login-email').value=payload.email;
    document.getElementById('login-password').focus();
  }catch(err){toast(err.message||'Registration failed','error');}
  finally{btn.disabled=false;btn.innerHTML=old;lucide.createIcons();}
});

