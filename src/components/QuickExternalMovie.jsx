import { useState } from "react";
import { client } from "../services/backend";

const labels = {
  hy: {heading:"Ավելացնել ֆիլմ՝ արտաքին հղումով", title:"Ֆիլմի անուն", titleRu:"Ռուսերեն անուն (ըստ ցանկության)",titleHy:"Հայերեն անուն (ըստ ցանկության)",genre:"Ժանրեր (ստորակետերով)",year:"Ամսաթիվ",day:"Օր",month:"Ամիս",yearPart:"Տարի",poster:"Նկարի HTTPS հղում",choose:"Ընտրել նկար համակարգչից",uploading:"Նկարը վերբեռնվում է…",uploaded:"Նկարը վերբեռնվեց։ Այժմ կարող ես պահպանել ֆիլմը։",preview:"Ընտրված պաստառ",description:"Նկարագրություն",url:"Դիտման արտաքին հղում",terms:"Հաստատում եմ, որ ստուգել եմ արտաքին կայքի հղումների տարածման պայմանները և այս հղումը թույլատրված է հրապարակել",submit:"Պահպանել և հրապարակել",saving:"Պահպանվում է…",success:"Ֆիլմը պահպանվեց և հրապարակվեց արտաքին հղումով։ Թարմացրու գլխավոր էջը՝ ստուգելու համար։",duplicate:"Այս արտաքին հղումով ֆիլմն արդեն գոյություն ունի։",intro:"Մուտքագրիր ֆիլմի տվյալներն ու արտաքին էջի հասցեն։ «Դիտել» կոճակը նոր ներդիրում կբացի արտաքին կայքը․ KinoLab-ը ֆիլմը չի վերահեռարձակում։"},
  ru: {heading:"Добавить фильм с внешней ссылкой",title:"Название",titleRu:"Название по-русски (необязательно)",titleHy:"Название по-армянски (необязательно)",genre:"Жанры (через запятую)",year:"Дата выхода",day:"День",month:"Месяц",yearPart:"Год",poster:"HTTPS-ссылка на постер",choose:"Загрузить постер с компьютера",uploading:"Загрузка изображения…",uploaded:"Изображение загружено. Теперь можно сохранить фильм.",preview:"Предпросмотр постера",description:"Описание",url:"Ссылка на внешний просмотр",terms:"Подтверждаю, что проверил условия стороннего сайта и публикация этой ссылки разрешена",submit:"Сохранить и опубликовать",saving:"Сохранение…",success:"Фильм сохранён и опубликован. Обновите главную страницу.",duplicate:"Фильм с этой ссылкой уже есть.",intro:"Сохраните данные и ссылку. «Смотреть» откроет сторонний сайт в новой вкладке; KinoLab не транслирует фильм."},
  en: {heading:"Add a movie with an external link",title:"Title",titleRu:"Russian title (optional)",titleHy:"Armenian title (optional)",genre:"Genres (comma-separated)",year:"Release date",day:"Day",month:"Month",yearPart:"Year",poster:"HTTPS poster URL",choose:"Upload poster from computer",uploading:"Uploading image…",uploaded:"Image uploaded. You can now save the movie.",preview:"Poster preview",description:"Description",url:"External watch URL",terms:"I checked the external site's linking terms and have permission to publish this link",submit:"Save and publish",saving:"Saving…",success:"Movie saved and published. Refresh the storefront to check.",duplicate:"A movie using this link already exists.",intro:"Enter movie information and the external watch URL. Watch opens the provider in a new tab; KinoLab does not host the movie."}
};
const allowed = url => /^https:\/\/api\.nextembed\.ws\/embed\/(movie|tv)\/\d+(?:\/\d+\/\d+)?\/?$/.test(url);
export default function QuickExternalMovie({language}) {
  const t=labels[language] || labels.en;
  const [busy,setBusy]=useState(false),[notice,setNotice]=useState("");
  const [posterUrl,setPosterUrl]=useState("");
  const [uploading,setUploading]=useState(false);
  async function uploadPoster(event) {
    const input=event.currentTarget;
    const file=input.files?.[0];
    if(!file)return;
    if(!["image/jpeg","image/png","image/webp"].includes(file.type) || file.size===0 || file.size>8*1024*1024) {
      setNotice(({hy:"Ընտրիր JPG, PNG կամ WebP նկար՝ մինչև 8 ՄԲ։",ru:"Выберите JPG, PNG или WebP до 8 МБ.",en:"Choose a JPG, PNG or WebP image, up to 8 MB."}[language]));
      input.value="";return;
    }
    setUploading(true);setNotice(t.uploading);
    try {
      const {data:{user},error:authError}=await client.auth.getUser();
      if(authError || !user)throw Error("Sign in to KinoLab Studio before uploading.");
      const extension={"image/jpeg":"jpg","image/png":"png","image/webp":"webp"}[file.type];
      const path=user.id+"/"+crypto.randomUUID()+"."+extension;
      const {error}=await client.storage.from("cinewave-assets").upload(path,file,{contentType:file.type,cacheControl:"3600",upsert:false});
      if(error)throw error;
      const {data}=client.storage.from("cinewave-assets").getPublicUrl(path);
      if(!data?.publicUrl)throw Error("Could not obtain image URL.");
      setPosterUrl(data.publicUrl);setNotice(t.uploaded);
    }catch(error){setNotice(error?.message||String(error))}
    finally{setUploading(false);input.value="";}
  }

  async function submit(event) {
    event.preventDefault();
    if(busy || uploading) return;
    const form=event.currentTarget;
    const v=Object.fromEntries(new FormData(form).entries());
    const url=String(v.external_watch_url||"").trim();
    if(!allowed(url)){setNotice("Use a direct HTTPS NextEmbed movie/TV URL, e.g. https://api.nextembed.ws/embed/movie/92733");return;}
    if(!form.elements.terms_confirmed.checked){setNotice(t.terms);return;}
    const day=Number(v.day), month=Number(v.month), year=Number(v.year);
    const actual=new Date(Date.UTC(year,month-1,day));
    if(!Number.isInteger(year)||year<1888||year>2100||
       !Number.isInteger(month)||month<1||month>12||
       !Number.isInteger(day)||day<1||day>31||
       actual.getUTCFullYear()!==year||actual.getUTCMonth()+1!==month||actual.getUTCDate()!==day){
      setNotice(({hy:"Գրիր ճիշտ օր, ամիս և տարի։",ru:"Введите правильные день, месяц и год.",en:"Enter a valid day, month, and year."}[language]));return;
    }
    const date=[year,String(month).padStart(2,"0"),String(day).padStart(2,"0")].join("-");
    setBusy(true);setNotice(t.saving);
    try {
      const payload={
        title_en:String(v.title_en||"").trim(),
        title_ru:String(v.title_ru||"").trim()||null,
        title_hy:String(v.title_hy||"").trim()||null,
        overview_en:String(v.overview_en||"").trim()||null,
        release_date:date,
        genre_names:String(v.genres||"").split(",").map(x=>x.trim()).filter(Boolean),
        poster_path:posterUrl.trim()||null,
        external_watch_url:url,
        terms_confirmed:true,
        is_published:true
      };
      const {error}=await client.from("kinolab_external_catalog").insert(payload);
      if(error) {
        if(error.code==="23505") throw Error(t.duplicate);
        throw error;
      }
      form.reset();setPosterUrl("");setNotice(t.success);
    } catch(error) {setNotice(error?.message||String(error));}
    finally {setBusy(false);}
  }
  return <section className="panel quick-external">
    <h2>{t.heading}</h2><p className="hint">{t.intro}</p>
    <form onSubmit={submit}>
      <div className="form-grid">
        <label>{t.title}<input name="title_en" required maxLength="250"/></label>
        <label>{t.titleRu}<input name="title_ru" maxLength="250"/></label>
        <label>{t.titleHy}<input name="title_hy" maxLength="250"/></label>
        <label>{t.genre}<input name="genres" placeholder="Drama, Comedy"/></label>
        <label>{t.year}
          <span style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:8}}>
            <input name="day" type="number" min="1" max="31" placeholder={t.day} aria-label={t.day} required/>
            <input name="month" type="number" min="1" max="12" placeholder={t.month} aria-label={t.month} required/>
            <input name="year" type="number" min="1888" max="2100" placeholder={t.yearPart} aria-label={t.yearPart} required/>
          </span>
        </label>
        <label>{t.poster}
          <input name="poster_path" type="url" placeholder="https://..." value={posterUrl} onChange={e=>setPosterUrl(e.target.value)}/>
          <span>{t.choose}</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadPoster} disabled={busy||uploading}/>
          {posterUrl.startsWith("https://") && <img src={posterUrl} alt={t.preview} loading="lazy" style={{width:110,height:165,objectFit:"cover",borderRadius:8}}/>}
        </label>
        <label>{t.description}<textarea name="overview_en" rows="3"/></label>
        <label>{t.url}<input name="external_watch_url" type="url" required placeholder="https://api.nextembed.ws/embed/movie/92733"/></label>
      </div>
      <label className="check"><input name="terms_confirmed" type="checkbox" required />{t.terms}</label>
      <div className="form-actions">
        <button type="submit" className="primary" disabled={busy||uploading}>{busy?t.saving:uploading?t.uploading:t.submit}</button>
        <button type="button" className="secondary" onClick={()=>{const url=document.querySelector('.quick-external input[name="external_watch_url"]')?.value?.trim();if(allowed(url))window.open(url,"_blank","noopener,noreferrer");else setNotice("Enter a valid NextEmbed link first.");}}>{({hy:"Փորձարկել հղումը",ru:"Проверить ссылку",en:"Test link"}[language])}</button>
      </div>
    </form><p role="status" aria-live="polite">{notice}</p>
  </section>;
}
