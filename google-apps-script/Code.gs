/**
 * Frieden Institut backend — NEW CLEAN INSTALL
 * Google Sheets + Drive + individual staff accounts.
 * Deploy as Web App: Execute as Me / Anyone.
 */
const APP_VERSION='V26';
const BACKEND_CONFIG={
  SESSION_TTL:21600,
  REGISTRATIONS_SHEET:'Inscriptions',
  SETTINGS_SHEET:'Paramètres',
  STAFF_SHEET:'Personnel',
  DRIVE_FOLDER:'Frieden Institut Uploads'
};
const REG_HEADERS=['Référence','Créé le','Prénom','Nom','Nom complet','Date de naissance','Numéro de passeport','Numéro de carte nationale d’identité','Indicatif téléphonique','Téléphone','E-mail','Adresse','URL de la photo de l’étudiant','Niveau d’allemand','Type de cours','Services sélectionnés (JSON)','Noms des services sélectionnés','Options gratuites','Date de début','Inscription enregistrée par','Statut de l’inscription','Frais de service avant réduction (FCFA)','Type de réduction','Pourcentage de réduction','Montant de la réduction (FCFA)','Frais de service après réduction (FCFA)','Frais d’inscription (FCFA)','Statut des frais d’inscription','Montant des frais d’inscription payé (FCFA)','Statut des frais de service','Montant des frais de service payé (FCFA)','Total dû (FCFA)','Total payé (FCFA)','Solde restant dû (FCFA)','Notes complémentaires','Données d’inscription (JSON)','Identifiant du dossier'];
const STAFF_HEADERS=['Nom d’utilisateur','Nom','Empreinte du mot de passe','Rôle','Actif','Créé le'];
const SERVICE_HEADERS=['Référence d’inscription','Créé le','Nom de l’étudiant','Nom du service','Prix (FCFA)','Option gratuite','Niveau d’allemand','Type de cours','Date de début','Frais d’inscription (FCFA)','Statut des frais d’inscription','Montant des frais d’inscription payé (FCFA)','Frais de service avant réduction (FCFA)','Type de réduction','Pourcentage de réduction','Montant de la réduction (FCFA)','Frais de service après réduction (FCFA)','Statut des frais de service','Montant des frais de service payé (FCFA)','Total dû (FCFA)','Total payé (FCFA)','Solde restant dû (FCFA)'];

function setup(){
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  const reg=ss.getSheetByName(BACKEND_CONFIG.REGISTRATIONS_SHEET)||ss.insertSheet(BACKEND_CONFIG.REGISTRATIONS_SHEET);
  ensureRegistrationHeaders_(reg);
  const serviceDetails=ss.getSheetByName('Détails des services')||ss.insertSheet('Détails des services');
  ensureServiceHeaders_(serviceDetails);
  const settings=ss.getSheetByName(BACKEND_CONFIG.SETTINGS_SHEET)||ss.insertSheet(BACKEND_CONFIG.SETTINGS_SHEET);
  ensureSettings_(settings);
  const staff=ss.getSheetByName(BACKEND_CONFIG.STAFF_SHEET)||ss.insertSheet(BACKEND_CONFIG.STAFF_SHEET);
  ensureStaffHeaders_(staff);
  seedAdmin_(staff);
  getOrCreateFolder_();
}

function doGet(e){
  try{
    const a=(e&&e.parameter&&e.parameter.action)||'health';
    if(a==='health')return json_({ok:true,version:APP_VERSION,message:'Le serveur Frieden Institut fonctionne.'});
    if(a==='login')return login_(e.parameter.username||'',e.parameter.password||'');
    if(a==='bootstrap')return bootstrap_(e.parameter.token||'');
    if(a==='meta'){requireAuth_(e.parameter.token||'');return json_({ok:true,count:getRecordCount_(),settingsVersion:getSettingsVersion_()});}
    if(a==='records'){requireAuth_(e.parameter.token||'');return recordsPage_(Number(e.parameter.offset||0),Number(e.parameter.limit||500));}
    if(a==='search'){requireAuth_(e.parameter.token||'');return search_(e.parameter.q||'');}
    if(a==='staff'){const s=requireAuth_(e.parameter.token||'');requireAdmin_(s);return json_({ok:true,staff:listStaff_()});}
    if(a==='csv'){requireAuth_(e.parameter.token||'');return csv_();}
    if(a==='xlsx'){requireAuth_(e.parameter.token||'');return xlsx_();}
    return json_({ok:false,error:'Action inconnue.'});
  }catch(err){return json_({ok:false,error:String(err&&err.message||err)});}
}
function doPost(e){
  try{
    const body=JSON.parse((e.postData&&e.postData.contents)||'{}');
    if(body.action==='login')return login_(body.username||'',body.password||'');
    if(body.action==='registration')return saveRegistration_(body.record||{},body.token||'');
    if(body.action==='settings'){const s=requireAuth_(body.token||'');requireAdmin_(s);return saveSettings_(body.settings||{});}
    if(body.action==='staffList'){const s=requireAuth_(body.token||'');requireAdmin_(s);return json_({ok:true,staff:listStaff_()});}
    if(body.action==='staffSave'){const s=requireAuth_(body.token||'');requireAdmin_(s);return saveStaff_(body.staff||{});}
    if(body.action==='staffDelete'){const s=requireAuth_(body.token||'');requireAdmin_(s);return deleteStaff_(body.username||'',s.username);}
    if(body.action==='logout')return logout_(body.token||'');
    return json_({ok:false,error:'Action inconnue.'});
  }catch(err){return json_({ok:false,error:String(err&&err.message||err)});}
}

function login_(username,password){
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  if(!ss)throw new Error('Ce script Apps Script doit être associé au fichier Google Sheets de Frieden Institut.');
  const sh=ss.getSheetByName(BACKEND_CONFIG.STAFF_SHEET);
  if(!sh)throw new Error('Feuille Personnel introuvable. Exécutez setup() une fois.');
  ensureStaffHeaders_(sh);
  const u=String(username||'').trim().toLowerCase();
  if(!u||!String(password||''))return json_({ok:false,error:'Le nom d’utilisateur et le mot de passe sont obligatoires.'});
  const values=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,STAFF_HEADERS.length).getValues():[];
  const row=values.find(r=>String(r[0]).trim().toLowerCase()===u);
  if(!row)return json_({ok:false,error:'Nom d’utilisateur ou mot de passe incorrect.'});
  const active=String(row[4]).trim().toLowerCase()==='true';
  const storedHash=String(row[2]||'').trim();
  const suppliedHash=hashPassword_(String(password));
  if(!active||!storedHash||storedHash!==suppliedHash)return json_({ok:false,error:'Nom d’utilisateur ou mot de passe incorrect.'});
  const user={username:String(row[0]).trim(),name:String(row[1]||row[0]).trim(),role:String(row[3]||'Staff').trim()||'Staff'};
  const token=Utilities.getUuid();
  CacheService.getScriptCache().put('auth:'+token,JSON.stringify(user),BACKEND_CONFIG.SESSION_TTL);
  return json_({ok:true,version:APP_VERSION,token:token,username:user.username,name:user.name,role:user.role,expiresIn:BACKEND_CONFIG.SESSION_TTL});
}
function logout_(token){
  if(token)CacheService.getScriptCache().remove('auth:'+String(token));
  return json_({ok:true});
}

// Run this once if the original admin account has an unknown password.
// It does not affect any other staff account.
function resetAdminPassword(){
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(BACKEND_CONFIG.STAFF_SHEET)||SpreadsheetApp.getActiveSpreadsheet().insertSheet(BACKEND_CONFIG.STAFF_SHEET);
  ensureStaffHeaders_(sh);
  const values=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,STAFF_HEADERS.length).getValues():[];
  const matches=[];
  values.forEach((r,i)=>{if(String(r[0]).trim().toLowerCase()==='admin')matches.push(i+2);});
  if(matches.length){
    const row=matches[0];
    const old=sh.getRange(row,1,1,STAFF_HEADERS.length).getValues()[0];
    sh.getRange(row,1,1,STAFF_HEADERS.length).setValues([['admin',String(old[1]||'Administrator'),hashPassword_('Frieden@2026'),'Administrator',true,old[5]||new Date().toISOString()]]);
    for(let i=matches.length-1;i>=1;i--)sh.deleteRow(matches[i]);
  }else{
    sh.appendRow(['admin','Administrator',hashPassword_('Frieden@2026'),'Administrator',true,new Date().toISOString()]);
  }
  SpreadsheetApp.flush();
  return 'Réinitialisation administrateur effectuée. Nom d’utilisateur : admin | Mot de passe : Frieden@2026';
}


// Safe first-install verification. Does not print the password or its hash.
function verifyFreshAdminSetup(){
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  const sh=ss && ss.getSheetByName(BACKEND_CONFIG.STAFF_SHEET);
  if(!sh) throw new Error('Feuille Personnel introuvable. Exécutez d’abord setup().');
  const rows=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,STAFF_HEADERS.length).getValues():[];
  const admin=rows.find(r=>String(r[0]).trim().toLowerCase()==='admin');
  const result={spreadsheet:ss.getName(),spreadsheetId:ss.getId(),adminFound:!!admin};
  if(admin){
    result.active=String(admin[4]).trim().toLowerCase()==='true';
    result.role=String(admin[3]||'');
    result.passwordConfigured=!!String(admin[2]||'').trim();
    result.initialPasswordMatches=String(admin[2]||'').trim()===hashPassword_('Frieden@2026');
  }
  console.log(JSON.stringify(result,null,2));
  return result;
}

function testStaffAuthentication(){
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(BACKEND_CONFIG.STAFF_SHEET);
  if(!sh)return 'Feuille Personnel introuvable. Exécutez d’abord setup().';
  const values=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,STAFF_HEADERS.length).getValues():[];
  return values.map(r=>({username:String(r[0]),active:String(r[4]),hasPasswordHash:!!String(r[2]||'').trim(),hashLength:String(r[2]||'').trim().length,role:String(r[3]||'Staff')}));
}

function requireAuth_(token){
  if(!token)throw new Error('Authentification requise.');
  const raw=CacheService.getScriptCache().get('auth:'+token);
  if(!raw)throw new Error('Session expirée. Veuillez vous reconnecter.');
  return JSON.parse(raw);
}
function requireAdmin_(user){if(!user||String(user.role)!=='Administrator')throw new Error('Accès réservé à l’administrateur.');}

function bootstrap_(token){
  const user=requireAuth_(token);
  return json_({ok:true,user:user,settings:getSettings_(),meta:{count:getRecordCount_(),settingsVersion:getSettingsVersion_()},records:getRecords_(0,20)});
}
function recordsPage_(offset,limit){
  offset=Math.max(0,offset||0);limit=Math.min(1000,Math.max(1,limit||500));
  return json_({ok:true,records:getRecords_(offset,limit),offset:offset,limit:limit,total:getRecordCount_()});
}
function search_(q){
  const query=String(q||'').trim().toLowerCase();
  const rows=getRecords_(0,1000);
  const found=!query?rows:rows.filter(r=>[r.ref,r.name,r.phone,r.email,r.level,r.course].join(' ').toLowerCase().indexOf(query)>=0);
  return json_({ok:true,records:found.slice(0,100)});
}

function saveRegistration_(r,token){
  const lock=LockService.getScriptLock();lock.waitLock(15000);
  try{
    const user=requireAuth_(token);
    const ss=SpreadsheetApp.getActiveSpreadsheet();
    const sh=ss.getSheetByName(BACKEND_CONFIG.REGISTRATIONS_SHEET)||ss.insertSheet(BACKEND_CONFIG.REGISTRATIONS_SHEET);
    ensureRegistrationHeaders_(sh);
    const id=Utilities.getUuid();
    const now=new Date().toISOString();
    const ref=makeReference_(sh);
    const rawNotes=String(r.notes||'');
    const wrapper=parseJsonSafe_(rawNotes,{});
    const meta=wrapper.details||wrapper||{};
    const services=Array.isArray(meta.services)?meta.services:(Array.isArray(r.services)?r.services:[]);
    const firstName=String(r.firstName||meta.firstName||'').trim();
    const lastName=String(r.lastName||meta.lastName||'').trim();
    const fullName=String(r.name||[firstName,lastName].filter(Boolean).join(' ')).trim();
    const subtotal=numberOr_(meta.subtotal,services.reduce((sum,item)=>sum+Math.max(0,Number(item.price)||0),0));
    const reductionMode=String(meta.discountMode||meta.reductionMode||'percent');
    const reductionPercent=Math.max(0,Math.min(100,Number(meta.reductionPercent)||0));
    const requestedReduction=Math.max(0,Number(meta.reduction)||0);
    const reduction=Math.min(subtotal,reductionMode==='percent'?Math.round(subtotal*reductionPercent/100):requestedReduction);
    const serviceAfterReduction=Math.max(0,numberOr_(meta.serviceTotal,subtotal-reduction));
    const inscriptionFee=Math.max(0,numberOr_(meta.inscriptionFee,20000));
    const inscriptionStatus=String(meta.inscriptionStatus||'Not paid');
    const inscriptionPaid=inscriptionStatus.toLowerCase()==='paid'?inscriptionFee:0;
    let servicePaid=Math.max(0,Number(meta.paid)||0);
    const serviceStatus=String(meta.serviceFeeStatus||meta.paymentStatus||'Not paid');
    if(serviceStatus.toLowerCase()==='paid'&&servicePaid===0)servicePaid=serviceAfterReduction;
    servicePaid=Math.min(serviceAfterReduction,servicePaid);
    const totalDue=serviceAfterReduction+inscriptionFee;
    const totalPaid=Math.min(totalDue,servicePaid+inscriptionPaid);
    const balance=Math.max(0,totalDue-totalPaid);
    let photoUrl=String(r.studentPhoto||'');
    if(photoUrl.indexOf('data:image/')===0)photoUrl=saveDataImage_(photoUrl,'student-'+ref);
    const selectedNames=services.map(item=>String(item.name||'')).filter(Boolean);
    const addOns=Array.isArray(meta.addons)?meta.addons:services.filter(item=>item.free).map(item=>item.name);
    const germanService=services.find(item=>item.courseType||String(item.name||'').toLowerCase().startsWith('german course'));
    const courseType=String((germanService&&(germanService.courseType||meta.courseType||r.courseType))||'');
    const level=String(r.level||meta.level||services.find(item=>item.level)?.level||'');
    const record={
      id:id,ref:ref,created:now,firstName:firstName,lastName:lastName,name:fullName,
      dob:String(r.dob||meta.dob||''),passport:String(r.passport||meta.passport||''),nationalId:String(r.nationalId||meta.nationalId||''),
      countryCode:String(r.countryCode||String(r.phone||'').match(/^\+?\d+/)?.[0]||''),phone:String(r.phone||''),email:String(r.email||''),address:String(r.address||''),studentPhoto:photoUrl,
      level:level,course:courseType,services:JSON.stringify(services),serviceNames:selectedNames.join(', '),addons:addOns.join(', '),start:String(r.start||meta.start||''),
      registeredBy:user?user.name:'Online Registration',registrationStatus:user?(r.registrationStatus||'Registered'):'Pending',
      subtotal:subtotal,reductionMode:reductionMode,reductionPercent:reductionPercent,reduction:reduction,serviceTotal:serviceAfterReduction,
      inscriptionFee:inscriptionFee,inscriptionStatus:inscriptionStatus,inscriptionPaid:inscriptionPaid,
      paymentStatus:serviceStatus,servicePaid:servicePaid,total:totalDue,totalPaid:totalPaid,balance:balance,
      notes:rawNotes,additionalNotes:String(wrapper.notes||meta.additionalNotes||r.additionalNotes||''),
      registrationData:JSON.stringify({details:meta,notes:String(wrapper.notes||meta.additionalNotes||''),sourceFields:{dob:r.dob||'',countryCode:r.countryCode||'',phone:r.phone||'',email:r.email||'',address:r.address||'',start:r.start||'',registrationStatus:r.registrationStatus||''}})
    };
    const rowByHeader={
      'Référence':record.ref,'Créé le':record.created,'Prénom':record.firstName,'Nom':record.lastName,'Nom complet':record.name,
      'Date de naissance':record.dob,'Numéro de passeport':record.passport,'Numéro de carte nationale d’identité':record.nationalId,'Indicatif téléphonique':record.countryCode,
      'Téléphone':record.phone,'E-mail':record.email,'Adresse':record.address,'URL de la photo de l’étudiant':record.studentPhoto,'Niveau d’allemand':record.level,
      'Type de cours':record.course,'Services sélectionnés (JSON)':record.services,'Noms des services sélectionnés':record.serviceNames,'Options gratuites':record.addons,
      'Date de début':record.start,'Inscription enregistrée par':record.registeredBy,'Statut de l’inscription':record.registrationStatus,
      'Frais de service avant réduction (FCFA)':record.subtotal,'Type de réduction':record.reductionMode,'Pourcentage de réduction':record.reductionPercent,
      'Montant de la réduction (FCFA)':record.reduction,'Frais de service après réduction (FCFA)':record.serviceTotal,'Frais d’inscription (FCFA)':record.inscriptionFee,
      'Statut des frais d’inscription':record.inscriptionStatus,'Montant des frais d’inscription payé (FCFA)':record.inscriptionPaid,'Statut des frais de service':record.paymentStatus,
      'Montant des frais de service payé (FCFA)':record.servicePaid,'Total dû (FCFA)':record.total,'Total payé (FCFA)':record.totalPaid,'Solde restant dû (FCFA)':record.balance,
      'Notes complémentaires':record.additionalNotes,'Données d’inscription (JSON)':record.registrationData,'Identifiant du dossier':record.id
    };
    sh.appendRow(REG_HEADERS.map(h=>rowByHeader[h]===undefined?'':rowByHeader[h]));
    saveServiceDetails_(ss,record,services);
    return json_({ok:true,record:record});
  }finally{lock.releaseLock();}
}
function parseJsonSafe_(value,fallback){try{return JSON.parse(String(value||''))||fallback;}catch(e){return fallback;}}
function numberOr_(value,fallback){const n=Number(value);return Number.isFinite(n)?n:fallback;}

function ensureServiceHeaders_(sh){
  if(sh.getLastRow()===0){sh.getRange(1,1,1,SERVICE_HEADERS.length).setValues([SERVICE_HEADERS]);sh.setFrozenRows(1);sh.getRange(1,1,1,SERVICE_HEADERS.length).setFontWeight('bold');return;}
  const old=sh.getRange(1,1,1,Math.max(1,sh.getLastColumn())).getValues()[0].map(String);
  if(old.length===SERVICE_HEADERS.length&&SERVICE_HEADERS.every((h,i)=>old[i]===h))return;
  const rows=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,old.length).getValues():[];
  const migrated=rows.map(row=>SERVICE_HEADERS.map(h=>{const i=old.indexOf(h);if(i>=0)return row[i];if(h==='Statut des frais de service'){const j=old.indexOf('Payment Status');return j>=0?row[j]:'Not paid';}return '';}));
  sh.clearContents();sh.getRange(1,1,1,SERVICE_HEADERS.length).setValues([SERVICE_HEADERS]);if(migrated.length)sh.getRange(2,1,migrated.length,SERVICE_HEADERS.length).setValues(migrated);sh.setFrozenRows(1);sh.getRange(1,1,1,SERVICE_HEADERS.length).setFontWeight('bold');
}
function saveServiceDetails_(ss,record,services){
  const sh=ss.getSheetByName('Détails des services')||ss.insertSheet('Détails des services');ensureServiceHeaders_(sh);
  (services||[]).forEach(item=>sh.appendRow([
    record.ref,record.created,record.name,String(item.name||''),Math.max(0,Number(item.price)||0),item.free?'Oui':'Non',
    String(item.level||record.level||''),String(item.courseType||record.course||''),record.start,record.inscriptionFee,
    record.inscriptionStatus,record.inscriptionPaid,record.subtotal,record.reductionMode,record.reductionPercent,record.reduction,
    record.serviceTotal,record.paymentStatus,record.servicePaid,record.total,record.totalPaid,record.balance
  ]));
}

function saveSettings_(incoming){
  const current=getSettings_();const merged=Object.assign({},current,incoming||{});
  if(merged.logo&&String(merged.logo).indexOf('data:image/')===0)merged.logo=saveDataImage_(merged.logo,'receipt-logo');
  if(merged.favicon&&String(merged.favicon).indexOf('data:image/')===0)merged.favicon=saveDataImage_(merged.favicon,'favicon');
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(BACKEND_CONFIG.SETTINGS_SHEET)||SpreadsheetApp.getActiveSpreadsheet().insertSheet(BACKEND_CONFIG.SETTINGS_SHEET);
  sh.clearContents();sh.appendRow(['Clé','Valeur']);Object.keys(merged).forEach(k=>sh.appendRow([k,merged[k]==null?'':merged[k]]));
  PropertiesService.getScriptProperties().setProperty('SETTINGS_VERSION',String(Date.now()));
  return json_({ok:true,settings:merged});
}

function listStaff_(){
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(BACKEND_CONFIG.STAFF_SHEET);if(!sh||sh.getLastRow()<2)return [];
  return sh.getRange(2,1,sh.getLastRow()-1,STAFF_HEADERS.length).getValues().map(r=>({username:String(r[0]),name:String(r[1]),role:String(r[3]||'Staff'),active:String(r[4]).toLowerCase()==='true',created:r[5] instanceof Date?r[5].toISOString():String(r[5]||'')}));
}
function saveStaff_(s){
  const lock=LockService.getScriptLock();
  lock.waitLock(15000);
  try{
    const username=String(s.username||'').trim().toLowerCase();
    const name=String(s.name||'').trim();
    const roleInput=String(s.role||'Staff').trim();
    const role=({'Personnel':'Staff','Responsable':'Manager','Administrateur':'Administrator','Administratrice':'Administrator'})[roleInput]||roleInput||'Staff';
    const active=s.active!==false;
    const password=String(s.password||'');
    if(!username||!name)throw new Error('Le nom et le nom d’utilisateur sont obligatoires.');
    if(!/^[a-z0-9._-]{3,32}$/.test(username))throw new Error('Le nom d’utilisateur doit contenir de 3 à 32 caractères : lettres, chiffres, point, soulignement ou trait d’union.');
    if(!['Administrator','Staff','Manager'].includes(role))throw new Error('Rôle du personnel invalide.');
    const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(BACKEND_CONFIG.STAFF_SHEET)||SpreadsheetApp.getActiveSpreadsheet().insertSheet(BACKEND_CONFIG.STAFF_SHEET);
    ensureStaffHeaders_(sh);
    const values=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,STAFF_HEADERS.length).getValues():[];
    let idx=-1;
    values.forEach((r,i)=>{if(String(r[0]).trim().toLowerCase()===username)idx=i+2;});
    if(idx<0){
      if(!password)throw new Error('Un mot de passe est obligatoire pour un nouveau compte du personnel.');
      sh.appendRow([username,name,hashPassword_(password),role,active,new Date().toISOString()]);
    }else{
      const old=sh.getRange(idx,1,1,STAFF_HEADERS.length).getValues()[0];
      if(String(old[3]).trim()==='Administrator'&&role!=='Administrator'&&String(old[4]).trim().toLowerCase()==='true'&&countActiveAdmins_(sh)<=1)throw new Error('Au moins un administrateur actif est nécessaire.');
      const existingHash=String(old[2]||'').trim();
      const hash=password?hashPassword_(password):existingHash;
      if(!hash)throw new Error('Ce compte n’a pas de mot de passe. Définissez-en un nouveau.');
      sh.getRange(idx,1,1,STAFF_HEADERS.length).setValues([[username,name,hash,role,active,old[5]||new Date().toISOString()]]);
    }
    SpreadsheetApp.flush();
    return json_({ok:true,version:APP_VERSION,staff:listStaff_()});
  }finally{lock.releaseLock();}
}
function deleteStaff_(username,currentUsername){
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(BACKEND_CONFIG.STAFF_SHEET);if(!sh)throw new Error('Feuille Personnel introuvable.');
  const u=String(username).toLowerCase();if(u===String(currentUsername).toLowerCase())throw new Error('Vous ne pouvez pas supprimer votre propre compte.');
  const values=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,STAFF_HEADERS.length).getValues():[];
  const row=values.findIndex(r=>String(r[0]).toLowerCase()===u);if(row<0)throw new Error('Compte du personnel introuvable.');
  const target=values[row];if(String(target[3])==='Administrator'&&String(target[4]).toLowerCase()==='true'&&countActiveAdmins_(sh)<=1)throw new Error('Au moins un administrateur actif est nécessaire.');
  sh.deleteRow(row+2);return json_({ok:true,staff:listStaff_()});
}
function countActiveAdmins_(sh){if(sh.getLastRow()<2)return 0;return sh.getRange(2,1,sh.getLastRow()-1,STAFF_HEADERS.length).getValues().filter(r=>String(r[3])==='Administrator'&&String(r[4]).toLowerCase()==='true').length;}
function seedAdmin_(sh){
  const values=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,STAFF_HEADERS.length).getValues():[];
  if(values.some(r=>String(r[0]).toLowerCase()==='admin'))return;
  sh.appendRow(['admin','Administrator',hashPassword_('Frieden@2026'),'Administrator',true,new Date().toISOString()]);
}
function ensureStaffHeaders_(sh) {
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, STAFF_HEADERS.length)
      .setValues([STAFF_HEADERS]);
    return;
  }

  const lastCol = sh.getLastColumn();

  const current = lastCol > 0
    ? sh.getRange(1, 1, 1, lastCol)
        .getDisplayValues()[0]
        .map(value => String(value).trim())
    : [];

  const matches =
    current.length === STAFF_HEADERS.length &&
    STAFF_HEADERS.every((header, i) => current[i] === header);

  if (matches) return;

  // Repair the header row only. Never migrate or clear staff records.
  if (lastCol <= STAFF_HEADERS.length) {
    sh.getRange(1, 1, 1, STAFF_HEADERS.length)
      .setValues([STAFF_HEADERS]);
    return;
  }

  throw new Error(
    'Les en-têtes de la feuille Personnel ne correspondent pas. Aucun compte du personnel n’a été modifié.'
  );
}
function hashPassword_(value){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,value,Utilities.Charset.UTF_8).map(b=>(b<0?b+256:b).toString(16).padStart(2,'0')).join('');}

function getRecords_(offset,limit){
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(BACKEND_CONFIG.REGISTRATIONS_SHEET);if(!sh||sh.getLastRow()<2)return [];
  const lastRow=sh.getLastRow(),lastCol=sh.getLastColumn(),start=Math.max(2,lastRow-(offset||0)-(limit||500)+1),num=Math.max(0,lastRow-start+1);
  if(!num)return [];
  const values=sh.getRange(start,1,num,lastCol).getValues();const h=sh.getRange(1,1,1,lastCol).getValues()[0];
  return values.reverse().map(row=>{const o={};h.forEach((k,i)=>o[k]=row[i]);return mapRecord_(o)});
}
function mapRecord_(o){return {
  id:String(o['Identifiant du dossier']||''),ref:String(o['Référence']||''),created:o['Créé le'] instanceof Date?o['Créé le'].toISOString():String(o['Créé le']||''),
  firstName:String(o['Prénom']||''),lastName:String(o['Nom']||''),name:String(o['Nom complet']||''),dob:String(o['Date de naissance']||''),
  passport:String(o['Numéro de passeport']||''),nationalId:String(o['Numéro de carte nationale d’identité']||''),countryCode:String(o['Indicatif téléphonique']||''),
  phone:String(o['Téléphone']||''),email:String(o['E-mail']||''),address:String(o['Adresse']||''),studentPhoto:String(o['URL de la photo de l’étudiant']||''),
  level:String(o['Niveau d’allemand']||''),course:String(o['Type de cours']||''),services:String(o['Services sélectionnés (JSON)']||'[]'),
  addons:String(o['Options gratuites']||''),start:String(o['Date de début']||''),registeredBy:String(o['Inscription enregistrée par']||''),
  registrationStatus:String(o['Statut de l’inscription']||'Registered'),subtotal:Number(o['Frais de service avant réduction (FCFA)'])||0,
  reductionMode:String(o['Type de réduction']||'percent'),reductionPercent:Number(o['Pourcentage de réduction'])||0,
  reduction:Number(o['Montant de la réduction (FCFA)'])||0,inscriptionFee:Number(o['Frais d’inscription (FCFA)'])||0,
  inscriptionStatus:String(o['Statut des frais d’inscription']||'Not paid'),inscriptionPaid:Number(o['Montant des frais d’inscription payé (FCFA)'])||0,
  serviceTotal:Number(o['Frais de service après réduction (FCFA)'])||0,total:Number(o['Total dû (FCFA)'])||0,
  totalPaid:Number(o['Total payé (FCFA)'])||0,paid:Number(o['Montant des frais de service payé (FCFA)'])||0,
  balance:Number(o['Solde restant dû (FCFA)'])||0,paymentStatus:String(o['Statut des frais de service']||'Not paid'),
  notes:String(o['Données d’inscription (JSON)']||o['Notes']||''),additionalNotes:String(o['Notes complémentaires']||'')
};}
function parseRegistrationMeta_(notes){try{const parsed=JSON.parse(String(notes||'{}'));return parsed.details||parsed||{};}catch(e){return {};}}
function getRecordCount_(){const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(BACKEND_CONFIG.REGISTRATIONS_SHEET);return sh?Math.max(0,sh.getLastRow()-1):0;}
function getSettings_(){const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(BACKEND_CONFIG.SETTINGS_SHEET);const out={};if(!sh||sh.getLastRow()<2)return out;sh.getRange(2,1,sh.getLastRow()-1,2).getValues().forEach(r=>{if(r[0])out[String(r[0])]=String(r[1]==null?'':r[1])});return out;}
function ensureSettings_(sh){
  const current=getSettingsFromSheet_(sh);const defaults={company:'Frieden Institut',course:'Cours d’allemand',initials:'FI',logo:'',favicon:'',dashboardEyebrow:'COURS D’ALLEMAND',dashboardHeadline:'Une gestion plus simple des apprenants en allemand.',dashboardDescription:'Créez des inscriptions, gérez les dossiers des étudiants et générez des reçus professionnels en quelques secondes.',receiptTitle:'Inscription de l’étudiant',footerCopyright:'© 2026 Frieden Institut. Tous droits réservés.',footerCredit:'Conçu et développé par Messways',companyTagline:'Éducation · Immigration · Mobilité',companyAddress:'',companyPhone:'',companyEmail:'',companyHours:'',companyAbout:'Frieden Institut accompagne les étudiants, les professionnels et les voyageurs dans leurs projets d’éducation, d’immigration et de mobilité internationale.'};let changed=false;Object.keys(defaults).forEach(k=>{if(current[k]===undefined){current[k]=defaults[k];changed=true}});if(current.company==='Messways'){current.company='Frieden Institut';changed=true}if(current.initials==='MW'){current.initials='FI';changed=true}if(changed){sh.clearContents();sh.appendRow(['Clé','Valeur']);Object.keys(current).forEach(k=>sh.appendRow([k,current[k]]));}}
function getSettingsFromSheet_(sh){const out={};if(!sh||sh.getLastRow()<2)return out;sh.getRange(2,1,sh.getLastRow()-1,2).getValues().forEach(r=>{if(r[0])out[String(r[0])]=String(r[1]==null?'':r[1])});return out;}
function getSettingsVersion_(){return PropertiesService.getScriptProperties().getProperty('SETTINGS_VERSION')||'0';}
function makeReference_(sh){return 'GER-'+new Date().getFullYear()+'-'+String(Math.max(1,sh.getLastRow())).padStart(5,'0')+'-'+Math.random().toString(36).slice(2,5).toUpperCase();}
function getOrCreateFolder_(){const props=PropertiesService.getScriptProperties(),saved=props.getProperty('UPLOAD_FOLDER_ID');if(saved){try{return DriveApp.getFolderById(saved)}catch(e){}}const folders=DriveApp.getFoldersByName(BACKEND_CONFIG.DRIVE_FOLDER);const f=folders.hasNext()?folders.next():DriveApp.createFolder(BACKEND_CONFIG.DRIVE_FOLDER);props.setProperty('UPLOAD_FOLDER_ID',f.getId());return f;}
function saveDataImage_(dataUrl,name){const m=String(dataUrl).match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/);if(!m)return '';const mime=m[1],bytes=Utilities.base64Decode(m[2]),ext=mime.split('/')[1].split('+')[0].replace('jpeg','jpg');const file=getOrCreateFolder_().createFile(Utilities.newBlob(bytes,mime,name+'-'+Date.now()+'.'+ext));file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);return 'https://drive.google.com/thumbnail?id='+file.getId()+'&sz=w600-h800';}
function ensureRegistrationHeaders_(sh){
  if(sh.getLastRow()===0){sh.getRange(1,1,1,REG_HEADERS.length).setValues([REG_HEADERS]);sh.setFrozenRows(1);sh.getRange(1,1,1,REG_HEADERS.length).setFontWeight('bold');return;}
  const lastCol=Math.max(1,sh.getLastColumn()),old=sh.getRange(1,1,1,lastCol).getValues()[0].map(String);
  if(old.length===REG_HEADERS.length&&REG_HEADERS.every((h,i)=>old[i]===h))return;
  const rows=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,lastCol).getValues():[];
  const migrated=rows.map(row=>{
    const oldObj={};old.forEach((h,i)=>{if(h)oldObj[h]=row[i];});
    let meta={};try{const parsed=JSON.parse(String(oldObj['Notes']||oldObj['Données d’inscription (JSON)']||'{}'));meta=parsed.details||parsed||{};}catch(e){}
    const full=String(oldObj['Nom complet']||'').trim().split(/\s+/);const first=String(oldObj['Prénom']||meta.firstName||full.shift()||'');const last=String(oldObj['Nom']||meta.lastName||full.join(' '));
    const services=Array.isArray(meta.services)?meta.services:parseJsonSafe_(oldObj['Services sélectionnés (JSON)']||'[]',[]);
    const subtotal=numberOr_(oldObj['Frais de service avant réduction (FCFA)'],numberOr_(oldObj['Subtotal CFA'],numberOr_(meta.subtotal,services.reduce((sum,x)=>sum+(Number(x.price)||0),0))));
    const mode=String(oldObj['Type de réduction']||meta.discountMode||'percent');const pct=Number(oldObj['Pourcentage de réduction']||meta.reductionPercent)||0;
    const reduction=numberOr_(oldObj['Montant de la réduction (FCFA)'],Number(meta.reduction)||0);const after=numberOr_(oldObj['Frais de service après réduction (FCFA)'],numberOr_(oldObj['Service Fee CFA'],numberOr_(meta.serviceTotal,Math.max(0,subtotal-reduction))));
    const inscription=numberOr_(oldObj['Frais d’inscription (FCFA)'],numberOr_(meta.inscriptionFee,20000));const insStatus=String(oldObj['Statut des frais d’inscription']||meta.inscriptionStatus||'Not paid');const insPaid=numberOr_(oldObj['Montant des frais d’inscription payé (FCFA)'],insStatus==='Paid'?inscription:0);
    const svcStatus=String(oldObj['Statut des frais de service']||meta.serviceFeeStatus||meta.paymentStatus||'Not paid');const svcPaid=numberOr_(oldObj['Montant des frais de service payé (FCFA)'],numberOr_(oldObj['Amount Paid CFA'],numberOr_(meta.paid,svcStatus==='Paid'?after:0)));
    const total=numberOr_(oldObj['Total dû (FCFA)'],numberOr_(meta.totalDue,after+inscription));const paid=numberOr_(oldObj['Total payé (FCFA)'],numberOr_(meta.totalPaid,svcPaid+insPaid));const balance=numberOr_(oldObj['Solde restant dû (FCFA)'],numberOr_(meta.balance,Math.max(0,total-paid)));
    const obj={
      'Référence':oldObj['Référence']||'','Créé le':oldObj['Créé le']||'','Prénom':first,'Nom':last,'Nom complet':oldObj['Nom complet']||[first,last].filter(Boolean).join(' '),
      'Date de naissance':oldObj['Date de naissance']||'','Numéro de passeport':oldObj['Numéro de passeport']||meta.passport||'','Numéro de carte nationale d’identité':oldObj['Numéro de carte nationale d’identité']||meta.nationalId||'',
      'Indicatif téléphonique':oldObj['Indicatif téléphonique']||String(oldObj['Téléphone']||'').match(/^\+?\d+/)?.[0]||'','Téléphone':oldObj['Téléphone']||'','E-mail':oldObj['E-mail']||'','Adresse':oldObj['Adresse']||'',
      'URL de la photo de l’étudiant':oldObj['URL de la photo de l’étudiant']||'','Niveau d’allemand':oldObj['Niveau d’allemand']||meta.level||'','Type de cours':oldObj['Type de cours']||meta.courseType||'',
      'Services sélectionnés (JSON)':JSON.stringify(services||[]),'Noms des services sélectionnés':(services||[]).map(x=>x.name||'').filter(Boolean).join(', '),
      'Options gratuites':oldObj['Options gratuites']||(meta.addons||[]).join(', '),'Date de début':oldObj['Date de début']||'','Inscription enregistrée par':oldObj['Inscription enregistrée par']||'',
      'Statut de l’inscription':oldObj['Statut de l’inscription']||'Registered','Frais de service avant réduction (FCFA)':subtotal,'Type de réduction':mode,'Pourcentage de réduction':pct,
      'Montant de la réduction (FCFA)':reduction,'Frais de service après réduction (FCFA)':after,'Frais d’inscription (FCFA)':inscription,'Statut des frais d’inscription':insStatus,
      'Montant des frais d’inscription payé (FCFA)':insPaid,'Statut des frais de service':svcStatus,'Montant des frais de service payé (FCFA)':svcPaid,'Total dû (FCFA)':total,'Total payé (FCFA)':paid,
      'Solde restant dû (FCFA)':balance,'Notes complémentaires':oldObj['Notes complémentaires']||parseJsonSafe_(oldObj['Notes']||'{}',{}).notes||'',
      'Données d’inscription (JSON)':oldObj['Données d’inscription (JSON)']||oldObj['Notes']||JSON.stringify({details:meta}),'Identifiant du dossier':oldObj['Identifiant du dossier']||''
    };
    return REG_HEADERS.map(h=>obj[h]===undefined?'':obj[h]);
  });
  sh.clearContents();sh.getRange(1,1,1,REG_HEADERS.length).setValues([REG_HEADERS]);if(migrated.length)sh.getRange(2,1,migrated.length,REG_HEADERS.length).setValues(migrated);sh.setFrozenRows(1);sh.getRange(1,1,1,REG_HEADERS.length).setFontWeight('bold');
}
function csv_(){
  const rows=getRecords_(0,100000);
  const data=[REG_HEADERS].concat(rows.map(r=>{
    const o={'Référence':r.ref,'Créé le':r.created,'Prénom':r.firstName,'Nom':r.lastName,'Nom complet':r.name,'Date de naissance':r.dob,'Numéro de passeport':r.passport,'Numéro de carte nationale d’identité':r.nationalId,'Indicatif téléphonique':r.countryCode,'Téléphone':r.phone,'E-mail':r.email,'Adresse':r.address,'URL de la photo de l’étudiant':r.studentPhoto,'Niveau d’allemand':r.level,'Type de cours':r.course,'Services sélectionnés (JSON)':r.services,'Noms des services sélectionnés':(()=>{try{return JSON.parse(r.services||'[]').map(x=>x.name||'').join(', ')}catch(e){return ''}})(),'Options gratuites':r.addons,'Date de début':r.start,'Inscription enregistrée par':r.registeredBy,'Statut de l’inscription':r.registrationStatus,'Frais de service avant réduction (FCFA)':r.subtotal,'Type de réduction':r.reductionMode,'Pourcentage de réduction':r.reductionPercent,'Montant de la réduction (FCFA)':r.reduction,'Frais de service après réduction (FCFA)':r.serviceTotal,'Frais d’inscription (FCFA)':r.inscriptionFee,'Statut des frais d’inscription':r.inscriptionStatus,'Montant des frais d’inscription payé (FCFA)':r.inscriptionPaid,'Statut des frais de service':r.paymentStatus,'Montant des frais de service payé (FCFA)':r.paid,'Total dû (FCFA)':r.total,'Total payé (FCFA)':r.totalPaid,'Solde restant dû (FCFA)':r.balance,'Notes complémentaires':r.additionalNotes,'Données d’inscription (JSON)':r.notes,'Identifiant du dossier':r.id};return REG_HEADERS.map(h=>o[h]===undefined?'':o[h]);
  }));
  const csv=data.map(row=>row.map(v=>'"'+String(v==null?'':v).replace(/"/g,'""')+'"').join(',')).join('\r\n');
  return ContentService.createTextOutput(csv).setMimeType(ContentService.MimeType.CSV);
}
function xlsx_(){const source=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(BACKEND_CONFIG.REGISTRATIONS_SHEET);if(!source||source.getLastRow()<1)return json_({ok:false,error:'Aucune donnée d’inscription n’est disponible pour l’exportation.'});const temp=SpreadsheetApp.create('Exportation des inscriptions — Frieden Institut');const target=temp.getSheets()[0],data=source.getDataRange().getValues();target.getRange(1,1,data.length,data[0].length).setValues(data);target.setName('Inscriptions');SpreadsheetApp.flush();const response=UrlFetchApp.fetch('https://docs.google.com/spreadsheets/d/'+temp.getId()+'/export?format=xlsx',{headers:{Authorization:'Bearer '+ScriptApp.getOAuthToken()},muteHttpExceptions:true});if(response.getResponseCode()!==200){DriveApp.getFileById(temp.getId()).setTrashed(true);throw new Error('Google Sheets n’a pas pu créer le fichier Excel.');}const base64=Utilities.base64Encode(response.getBlob().getBytes());DriveApp.getFileById(temp.getId()).setTrashed(true);return json_({ok:true,filename:'frieden-institut-registrations-'+Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'yyyy-MM-dd')+'.xlsx',mime:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',base64:base64});}
function json_(obj){return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);}
