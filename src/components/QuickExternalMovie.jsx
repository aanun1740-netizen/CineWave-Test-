import {useState} from "react";
import {client} from "../services/backend";
const messages={
 hy:{title:"Արագ ավելացնել արտաքին դիտումով ֆիլմ",intro:"Լրացրու ֆիլմի տվյալները և արտաքին հղումը։ «Դիտել» կոճակը նոր ներդիրում կբացի հղումը։ Ֆիլմի ցուցադրման թույլտվության տվյալները պետք է իրական լինեն։",name:"Ֆիլմի անունը (անգլերեն)",ru:"Անվանումը ռուսերեն",hy:"Անվանումը հայերեն",link:"Արտաքին դիտման հղում (NextEmbed)",poster:"Պաստառի HTTPS հղում",description:"Նկարագրություն",holder:"Իրավատեր",license:"Թույլտվության տեսակ",proof:"Թույլտվության ապացույցի HTTPS հղում",terms:"Թույլտվության պայմանների HTTPS հղում",permission:"Հաստատում եմ, որ ունեմ ամբողջ ֆիլմի հանրային ցուցադրման և հղումով տարածման իրավունք, ներառյալ երաժշտությունը",button:"Պահպանել և տեղադրել կատալոգում",saving:"Պահպանվում է…",done:"Ֆիլմը ավելացված է կատալոգում։ Դիտման հղումը կցուցադրվի, եթե տվյալները անցնեն հրապարակման ստուգումը։"},
 ru:{title:"Быстро добавить фильм с внешней ссылкой",intro:"Кнопка «Смотреть» откроет внешний сайт в новой вкладке. Введите настоящие сведения о праве показа.",name:"Название (английский)",ru:"Название (русский)",hy:"Название (армянский)",link:"Ссылка на просмотр (NextEmbed)",poster:"HTTPS-ссылка на постер",description:"Описание",holder:"Правообладатель",license:"Тип разрешения",proof:"HTTPS-доказательство разрешения",terms:"HTTPS-условия лицензии",permission:"Подтверждаю право публичного распространения ссылки и полного фильма, включая музыку",button:"Сохранить в каталог",saving:"Сохранение…",done:"Фильм добавлен. Ссылка станет доступна после успешной проверки данных."},
 en:{title:"Quick-add film with external link",intro:"Watch opens the external site in a new tab. Enter genuine distribution permission details.",name:"English title",ru:"Russian title",hy:"Armenian title",link:"External watch link (NextEmbed)",poster:"HTTPS poster URL",description:"Description",holder:"Rights holder",license:"License type",proof:"Public HTTPS license evidence",terms:"HTTPS license terms",permission:"I confirm rights to distribute this public viewing link and film including the soundtrack",button:"Save to catalog",saving:"Saving…",done:"Movie added. Watch link appears if permission checks are satisfied."}
};
const allowed=(s)=>/^https:\/\/api\.nextembed\.ws\/embed\/(?:movie|tv)\/\d+(?:\/\d+\/\d+)?\/?$/.test(s);
export default function QuickExternalMovie({language}){
 const t=messages[language]||messages.en;
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState("");
 async function submit(e){
  e.preventDefault();if(busy)return;
  const form=e.currentTarget,fields=Object.fromEntries(new FormData(form));
  const embed=String(fields.embed||"").trim();
  if(!allowed(embed)){setNotice("Use an exact HTTPS NextEmbed movie or TV URL.");return;}
  if(!form.elements.permission.checked){setNotice("Confirm actual viewing and distribution rights.");return;}
  setBusy(true);setNotice(t.saving);
  try{
   const payload={
    title_en:fields.title_en.trim(),title_ru:fields.title_ru.trim()||null,title_hy:fields.title_hy.trim()||null,
    overview_en:fields.description.trim()||null,overview_ru:null,overview_hy:null,
    poster_path:fields.poster.trim()||null,embed_url:embed,media_type:embed.includes("/tv/")?"tv":"movie",
    rights_holder:fields.holder.trim(),license_type:fields.license.trim(),
    license_evidence_url:fields.proof.trim(),license_terms_url:fields.terms.trim(),
    commercial_streaming_permission:true,is_published:false,metadata_published:true
   };
   const {error}=await client.from("movies").insert(payload);
   if(error)throw error;
   setNotice(t.done);form.reset();
  }catch(err){setNotice(err.message||String(err))}
  finally{setBusy(false)}
 }
 return <section className="panel quick-external"><h2>{t.title}</h2><p className="hint">{t.intro}</p><p className="hint">{({hy:"Ստուգում․ հղումը բացվում է արտաքին էջում, ոչ iframe-ով։ ID-ն փոխանցվում է ուղիղ URL-ով, առանց ֆիլմը ներբեռնելու։",ru:"Проверка: ссылка откроется на внешнем сайте, без iframe. ID передаётся напрямую в URL.",en:"The link opens directly on the provider site (not in an iframe). The ID stays in the original URL."}[language])}</p>
  <form onSubmit={submit}><div className="form-grid">
   {[[ "title_en",t.name,true],[ "title_ru",t.ru,false],[ "title_hy",t.hy,false],["embed",t.link,true],["poster",t.poster,false],["description",t.description,false],["holder",t.holder,true],["license",t.license,true],["proof",t.proof,true],["terms",t.terms,true]].map(([id,label,required])=><label key={id}>{label}<input name={id} required={required} type={["embed","poster","proof","terms"].includes(id)?"url":"text"} /></label>)}
  </div><label className="check"><input name="permission" type="checkbox" required />{t.permission}</label><div className="form-actions"><button className="primary" disabled={busy} type="submit">{busy?t.saving:t.button}</button><button className="secondary" type="button" onClick={()=>{const url=document.querySelector('.quick-external input[name="embed"]')?.value?.trim();if(!allowed(url)){setNotice("Enter an exact HTTPS NextEmbed link first.");return;}window.open(url,"_blank","noopener,noreferrer");}}>{({hy:"Փորձարկել դիտման հղումը",ru:"Проверить просмотр",en:"Test watch link"}[language])}</button></div></form><p role="status">{notice}</p>
 </section>
}
