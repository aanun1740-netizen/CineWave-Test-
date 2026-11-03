import {useState} from "react";
import {client} from "../services/backend";
const messages={
 hy:{title:"Արագ ավելացնել արտաքին դիտումով ֆիլմ",intro:"Ավելացրու ֆիլմի տվյալները և արտաքին հղումը։ Պահպանելիս գրառումը հայտնվում է կատալոգում, իսկ դիտման հղման հրապարակումը ստուգվում է առանձին։",name:"Ֆիլմի անունը (անգլերեն)",ru:"Անվանումը ռուսերեն",hy:"Անվանումը հայերեն",link:"Արտաքին դիտման հղում (NextEmbed)",poster:"Պաստառի HTTPS հղում",description:"Նկարագրություն",holder:"Իրավատեր",license:"Թույլտվության տեսակ",proof:"Թույլտվության ապացույցի HTTPS հղում",terms:"Թույլտվության պայմանների HTTPS հղում",permission:"Ունեմ ֆիլմի հրապարակային ցուցադրման ու հղման տարածման փաստացի իրավունք (նշիր միայն եթե հաստատված է)",button:"Պահպանել և տեղադրել կատալոգում",saving:"Պահպանվում է…",done:"Ֆիլմի տվյալները պահպանված են կատալոգում։ Դիտման հղումը կհրապարակվի միայն թույլտվության պայմաններին համապատասխանելու դեպքում։"},
 ru:{title:"Быстро добавить фильм с внешней ссылкой",intro:"Добавьте описание и внешнюю ссылку. Карточка появится в каталоге, а публикация просмотра проверяется отдельно.",name:"Название (английский)",ru:"Название (русский)",hy:"Название (армянский)",link:"Ссылка на просмотр (NextEmbed)",poster:"HTTPS-ссылка на постер",description:"Описание",holder:"Правообладатель",license:"Тип разрешения",proof:"HTTPS-доказательство разрешения",terms:"HTTPS-условия лицензии",permission:"Имею подтверждённые права на публичное распространение фильма и ссылки (отметьте только если это правда)",button:"Сохранить в каталог",saving:"Сохранение…",done:"Фильм добавлен. Ссылка станет доступна после успешной проверки данных."},
 en:{title:"Quick-add film with external link",intro:"Save movie details and an external link. The catalog listing is separate from permission to publish the watch link.",name:"English title",ru:"Russian title",hy:"Armenian title",link:"External watch link (NextEmbed)",poster:"HTTPS poster URL",description:"Description",holder:"Rights holder",license:"License type",proof:"Public HTTPS license evidence",terms:"HTTPS license terms",permission:"I have verified rights to publicly distribute this link and film (check only if true)",button:"Save to catalog",saving:"Saving…",done:"Movie added. Watch link appears if permission checks are satisfied."}
};
const allowed=(s)=>/^https:\/\/api\.nextembed\.ws\/embed\/(?:movie|tv)\/\d+(?:\/\d+\/\d+)?\/?$/.test(s);
export default function QuickExternalMovie({language}){
 const t=messages[language]||messages.en;
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState("");
 async function submit(e){
  e.preventDefault();if(busy)return;
  const form=e.currentTarget,fields=Object.fromEntries(new FormData(form));
  const embed=String(fields.embed||"").trim();
  if(!allowed(embed)){setNotice(embed.startsWith("<") || embed.includes("<MPD") ? ({hy:"Տեղադրել ես MPD XML կոդ, ոչ թե արտաքին էջի հղում։ Այս դաշտում պետք է լինի HTTPS էջի հասցե, օրինակ՝ https://api.nextembed.ws/embed/movie/92733։ MPD-ի համար անհրաժեշտ է առանձին գործող .mpd URL և համապատասխան թույլտվություն։",ru:"Это XML-манифест MPD, а не ссылка на страницу. Вставьте HTTPS-ссылку NextEmbed; для DASH нужен действующий URL .mpd и разрешение.",en:"This is MPD XML, not a page URL. Use a NextEmbed HTTPS page link here; DASH playback requires a live .mpd URL and permission."}[language]) : "Use an exact HTTPS NextEmbed movie or TV URL.");return;}
  setBusy(true);setNotice(t.saving);
  try{
   const granted=form.elements.permission.checked;
   const payload={
    title_en:fields.title_en.trim(),title_ru:fields.title_ru.trim()||null,title_hy:fields.title_hy.trim()||null,
    overview_en:fields.description.trim()||null,overview_ru:null,overview_hy:null,
    poster_path:fields.poster.trim()||null,embed_url:embed,media_type:embed.includes("/tv/")?"tv":"movie",
    rights_holder:fields.holder.trim()||null,license_type:fields.license.trim()||null,
    license_evidence_url:fields.proof.trim()||null,license_terms_url:fields.terms.trim()||null,
    commercial_streaming_permission:granted,is_published:false,metadata_published:true
   };
   const {data:existing,error:readError}=await client.from("movies").select("id,embed_url").eq("embed_url",embed).order("id",{ascending:true}).limit(1);
   if(readError)throw readError;
   if(existing?.length){setNotice(({hy:"Այս հղումով ֆիլմն արդեն կա կատալոգում (ID "+existing[0].id+")։ Խմբագրիր գոյություն ունեցող գրառումը, նոր կրկնօրինակ պետք չէ։",ru:"Фильм с этой ссылкой уже существует (ID "+existing[0].id+"). Отредактируйте запись.",en:"A movie with this URL already exists (ID "+existing[0].id+"). Edit the existing entry instead."}[language]));return;}
   const {error}=await client.from("movies").insert(payload);
   if(error)throw error;
   setNotice(t.done);form.reset();
  }catch(err){setNotice(err.message||String(err))}
  finally{setBusy(false)}
 }
 return <section className="panel quick-external"><h2>{t.title}</h2><p className="hint">{t.intro}</p><p className="hint">{({hy:"Ստուգում․ հղումը բացվում է արտաքին էջում, ոչ iframe-ով։ ID-ն փոխանցվում է ուղիղ URL-ով, առանց ֆիլմը ներբեռնելու։",ru:"Проверка: ссылка откроется на внешнем сайте, без iframe. ID передаётся напрямую в URL.",en:"The link opens directly on the provider site (not in an iframe). The ID stays in the original URL."}[language])}</p><p className="hint">{({hy:"MPD/DASH XML-ը արտաքին էջի հղում չէ. դրա մեջ եղած ժամանակավոր հատվածների հասցեները չեն վերածվում մշտական դիտման հղման։",ru:"XML MPD/DASH не является ссылкой на страницу; временные URL сегментов не заменяют постоянную ссылку.",en:"An MPD/DASH XML file is not a watch page; temporary signed segment URLs cannot be turned into a permanent watch link."}[language])}</p>
  <form onSubmit={submit}><div className="form-grid">
   {[[ "title_en",t.name,true],[ "title_ru",t.ru,false],[ "title_hy",t.hy,false],["embed",t.link,true],["poster",t.poster,false],["description",t.description,false],["holder",t.holder,false],["license",t.license,false],["proof",t.proof,false],["terms",t.terms,false]].map(([id,label,required])=><label key={id}>{label}<input name={id} required={required} type={["embed","poster","proof","terms"].includes(id)?"url":"text"} /></label>)}
  </div><label className="check"><input name="permission" type="checkbox" />{t.permission}</label><div className="form-actions"><button className="primary" disabled={busy} type="submit">{busy?t.saving:t.button}</button><button className="secondary" type="button" onClick={()=>{const url=document.querySelector('.quick-external input[name="embed"]')?.value?.trim();if(!allowed(url)){setNotice("Enter an exact HTTPS NextEmbed link first.");return;}window.open(url,"_blank","noopener,noreferrer");}}>{({hy:"Փորձարկել դիտման հղումը",ru:"Проверить просмотр",en:"Test watch link"}[language])}</button></div></form><p role="status">{notice}</p>
 </section>
}
