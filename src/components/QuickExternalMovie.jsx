import { useEffect, useRef, useState } from "react";
import { client } from "../services/backend";

const labels = {
  hy: {heading:"Ավելացնել ֆիլմ՝ արտաքին հղումով", title:"Ֆիլմի անուն", titleRu:"Ռուսերեն անուն (ըստ ցանկության)",titleHy:"Հայերեն անուն (ըստ ցանկության)",genre:"Ժանրեր (ստորակետերով)",year:"Թողարկման տարեթիվ",trailer:"Թրեյլերի հղում (YouTube կամ Vimeo, ըստ ցանկության)",poster:"Նկարի HTTPS հղում",choose:"Ընտրել նկար համակարգչից",uploading:"Նկարը վերբեռնվում է…",uploaded:"Նկարը վերբեռնվեց։ Այժմ կարող ես պահպանել ֆիլմը։",preview:"Ընտրված պաստառ",description:"Նկարագրություն",url:"Դիտման արտաքին հղում",terms:"Հաստատում եմ, որ ստուգել եմ արտաքին կայքի հղումների տարածման պայմանները և այս հղումը թույլատրված է հրապարակել",submit:"Պահպանել և հրապարակել",saving:"Պահպանվում է…",success:"Ֆիլմը պահպանվեց և հրապարակվեց արտաքին հղումով։ Թարմացրու գլխավոր էջը՝ ստուգելու համար։",duplicate:"Այս արտաքին հղումով ֆիլմն արդեն գոյություն ունի։",intro:"Մուտքագրիր ֆիլմի տվյալներն ու արտաքին էջի հասցեն։ «Դիտել» կոճակը նոր ներդիրում կբացի արտաքին կայքը․ KinoLab-ը ֆիլմը չի վերահեռարձակում։", list:"Արտաքին հղումով ավելացված ֆիլմեր", refresh:"Թարմացնել ցանկը", remove:"Ջնջել", hide:"Հեռացնել կայքից", show:"Հրապարակել", confirmDelete:"Վերջնական ջնջե՞լ այս ֆիլմը։", empty:"Արտաքին հղումով ավելացված ֆիլմեր չկան։", deleted:"Ֆիլմը ջնջվեց արտաքին կատալոգից։", hidden:"Ֆիլմը հեռացվեց հանրային կայքից։", shown:"Ֆիլմը կրկին հրապարակվեց։",edit:"Խմբագրել",cancel:"Չեղարկել",saveEdit:"Պահպանել փոփոխությունները",updated:"Ֆիլմի փոփոխությունները պահպանվեցին։",editing:"Խմբագրվում է՝ "},
  ru: {heading:"Добавить фильм с внешней ссылкой",title:"Название",titleRu:"Название по-русски (необязательно)",titleHy:"Название по-армянски (необязательно)",genre:"Жанры (через запятую)",year:"Год выпуска",trailer:"Ссылка на трейлер (YouTube или Vimeo, необязательно)",poster:"HTTPS-ссылка на постер",choose:"Загрузить постер с компьютера",uploading:"Загрузка изображения…",uploaded:"Изображение загружено. Теперь можно сохранить фильм.",preview:"Предпросмотр постера",description:"Описание",url:"Ссылка на внешний просмотр",terms:"Подтверждаю, что проверил условия стороннего сайта и публикация этой ссылки разрешена",submit:"Сохранить и опубликовать",saving:"Сохранение…",success:"Фильм сохранён и опубликован. Обновите главную страницу.",duplicate:"Фильм с этой ссылкой уже есть.",intro:"Сохраните данные и ссылку. «Смотреть» откроет сторонний сайт в новой вкладке; KinoLab не транслирует фильм.", list:"Фильмы с внешними ссылками", refresh:"Обновить список", remove:"Удалить", hide:"Снять с публикации", show:"Опубликовать", confirmDelete:"Удалить этот фильм без возможности восстановления?", empty:"Нет фильмов с внешними ссылками.", deleted:"Фильм удалён из внешнего каталога.", hidden:"Фильм снят с публикации.", shown:"Фильм опубликован.",edit:"Редактировать",cancel:"Отмена",saveEdit:"Сохранить изменения",updated:"Изменения фильма сохранены.",editing:"Редактирование: "},
  en: {heading:"Add a movie with an external link",title:"Title",titleRu:"Russian title (optional)",titleHy:"Armenian title (optional)",genre:"Genres (comma-separated)",year:"Release year",trailer:"Trailer link (YouTube or Vimeo, optional)",poster:"HTTPS poster URL",choose:"Upload poster from computer",uploading:"Uploading image…",uploaded:"Image uploaded. You can now save the movie.",preview:"Poster preview",description:"Description",url:"External watch URL",terms:"I checked the external site's linking terms and have permission to publish this link",submit:"Save and publish",saving:"Saving…",success:"Movie saved and published. Refresh the storefront to check.",duplicate:"A movie using this link already exists.",intro:"Enter movie information and the external watch URL. Watch opens the provider in a new tab; KinoLab does not host the movie.", list:"External-link movies", refresh:"Refresh list", remove:"Delete", hide:"Unpublish", show:"Publish", confirmDelete:"Permanently delete this film?", empty:"No external-link movies found.", deleted:"Movie deleted from the external catalog.", hidden:"Movie removed from the public site.", shown:"Movie published.",edit:"Edit",cancel:"Cancel",saveEdit:"Save changes",updated:"Movie changes saved.",editing:"Editing: "}
};
const allowed = url => /^https:\/\/api\.nextembed\.ws\/embed\/(movie|tv)\/\d+(?:\/\d+\/\d+)?\/?$/.test(url);
// Trailers only link to recognized video platforms; they open in a new tab.
function allowedTrailer(raw) {
  try {
    const u=new URL(raw);
    if(u.protocol!=="https:" || u.username || u.password || u.port) return false;
    if(["youtube.com","www.youtube.com","m.youtube.com"].includes(u.hostname)) {
      if(u.pathname==="/watch") return /^[A-Za-z0-9_-]{11}$/.test(u.searchParams.get("v")||"");
      return /^\/(?:embed|shorts|live)\/[A-Za-z0-9_-]{11}\/?$/.test(u.pathname);
    }
    if(u.hostname==="youtu.be") return /^\/[A-Za-z0-9_-]{11}\/?$/.test(u.pathname);
    if(["vimeo.com","www.vimeo.com","player.vimeo.com"].includes(u.hostname))
      return /^\/(?:video\/)?[0-9]+\/?$/.test(u.pathname);
  } catch {}
  return false;
}

export default function QuickExternalMovie({language}) {
  const t=labels[language] || labels.en;
  const [busy,setBusy]=useState(false),[notice,setNotice]=useState("");
  const [posterUrl,setPosterUrl]=useState("");
  const [uploading,setUploading]=useState(false);
  const [externalMovies,setExternalMovies]=useState([]);
  const [listLoading,setListLoading]=useState(false);
  const [editingRow,setEditingRow]=useState(null);
  const formRef=useRef(null);
  async function refreshList() {
    setListLoading(true);
    try {
      const {data,error}=await client.from("kinolab_external_catalog")
        .select("*")
        .order("created_at",{ascending:false}).limit(500);
      if(error)throw error;
      setExternalMovies(data||[]);
    }catch(error){setNotice(error?.message||String(error));}
    finally{setListLoading(false);}
  }
  useEffect(()=>{refreshList();},[]);
  function resetEditor() {
    formRef.current?.reset();
    setPosterUrl("");
    setEditingRow(null);
  }
  function beginEdit(row) {
    if(busy||uploading)return;
    const form=formRef.current;
    if(!form)return;
    for(const name of ["title_en","title_ru","title_hy","overview_en","external_watch_url","trailer_url"]) {
      form.elements.namedItem(name).value = row[name] || "";
    }
    form.elements.namedItem("genres").value=Array.isArray(row.genre_names)?row.genre_names.join(", "):"";
    const year=String(row.release_date||"").slice(0,4);
    form.elements.namedItem("year").value=year?Number(year):"";
    form.elements.namedItem("terms_confirmed").checked=Boolean(row.terms_confirmed);
    setPosterUrl(row.poster_path||"");
    setEditingRow({id:row.id,is_published:row.is_published,release_date:row.release_date});
    setNotice("");
    form.scrollIntoView({behavior:"smooth",block:"start"});
    form.elements.namedItem("title_en").focus({preventScroll:true});
  }
  async function changeListing(row,remove) {
    if(busy||uploading)return;
    if(remove && !window.confirm(t.confirmDelete+"\\n"+(row.title_en||"ID "+row.id)))return;
    setBusy(true);
    try {
      if(remove){
        const {data,error}=await client.from("kinolab_external_catalog")
          .delete().eq("id",row.id).select("id");
        if(error)throw error;
        if(!data?.length)throw Error("Nothing was deleted; check administrator access.");
        setNotice(t.deleted);
      } else {
        const {data,error}=await client.from("kinolab_external_catalog")
          .update({is_published:!row.is_published}).eq("id",row.id).select("id");
        if(error)throw error;
        if(!data?.length)throw Error("No record updated; check administrator access.");
        setNotice(row.is_published?t.hidden:t.shown);
      }
      await refreshList();
    } catch(error){setNotice(error?.message||String(error));}
    finally{setBusy(false);}
  }

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
    const trailer=String(v.trailer_url||"").trim();
    if(trailer && !allowedTrailer(trailer)) {
      setNotice(({hy:"Թրեյլերի համար օգտագործիր YouTube-ի կամ Vimeo-ի ճիշտ HTTPS հղում։",ru:"Для трейлера укажите корректную HTTPS-ссылку YouTube или Vimeo.",en:"Use a valid HTTPS YouTube or Vimeo trailer link."}[language]));return;
    }
    if(!allowed(url)){setNotice("Use a direct HTTPS NextEmbed movie/TV URL, e.g. https://api.nextembed.ws/embed/movie/92733");return;}
    if(!form.elements.terms_confirmed.checked){setNotice(t.terms);return;}
    const year=Number(v.year);
    if(!/^\d{4}$/.test(String(v.year||""))||!Number.isInteger(year)||year<1888||year>2100){
      setNotice(({hy:"Գրիր ճիշտ տարեթիվ (1888–2100)։",ru:"Введите правильный год (1888–2100).",en:"Enter a valid year (1888–2100)."}[language]));return;
    }
    // The database column remains DATE. New movies use January 1 as a
    // storage placeholder; editing an unchanged year preserves the old date.
    const original=editingRow?.release_date||"";
    const date=original.startsWith(String(year)+"-") ? original : year+"-01-01";
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
        trailer_url:trailer||null,
        external_watch_url:url,
        terms_confirmed:true,
        is_published:editingRow ? editingRow.is_published : true
      };
      const result=editingRow
        ? await client.from("kinolab_external_catalog").update(payload).eq("id",editingRow.id).select("id")
        : await client.from("kinolab_external_catalog").insert(payload).select("id");
      if(result.error) {
        if(result.error.code==="23505") throw Error(t.duplicate);
        throw result.error;
      }
      if(!result.data?.length)throw Error("No record was saved. Check your administrator access.");
      resetEditor();
      setNotice(editingRow?t.updated:t.success);
      await refreshList();
    } catch(error) {setNotice(error?.message||String(error));}
    finally {setBusy(false);}
  }
  return <section className="panel quick-external">
    <h2>{t.heading}</h2><p className="hint">{t.intro}</p>
    {editingRow && <p className="hint" role="status">{t.editing} ID {editingRow.id}</p>}
    <form ref={formRef} onSubmit={submit}>
      <div className="form-grid">
        <label>{t.title}<input name="title_en" required maxLength="250"/></label>
        <label>{t.titleRu}<input name="title_ru" maxLength="250"/></label>
        <label>{t.titleHy}<input name="title_hy" maxLength="250"/></label>
        <label>{t.genre}<input name="genres" placeholder="Drama, Comedy"/></label>
        <label>{t.year}
          <input name="year" type="number" min="1888" max="2100" step="1" placeholder="2026" aria-label={t.year} required/>
        </label>
        <label>{t.poster}
          <input name="poster_path" type="url" placeholder="https://..." value={posterUrl} onChange={e=>setPosterUrl(e.target.value)}/>
          <span>{t.choose}</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadPoster} disabled={busy||uploading}/>
          {posterUrl.startsWith("https://") && <img src={posterUrl} alt={t.preview} loading="lazy" style={{width:110,height:165,objectFit:"cover",borderRadius:8}}/>}
        </label>
        <label>{t.description}<textarea name="overview_en" rows="3"/></label>
        <label>{t.url}<input name="external_watch_url" type="url" required placeholder="https://api.nextembed.ws/embed/movie/92733"/></label>
        <label>{t.trailer}<input name="trailer_url" type="url" maxLength="2048" placeholder="https://www.youtube.com/watch?v=..."/></label>
      </div>
      <label className="check"><input name="terms_confirmed" type="checkbox" required />{t.terms}</label>
      <div className="form-actions">
        <button type="submit" className="primary" disabled={busy||uploading}>{busy?t.saving:uploading?t.uploading:editingRow?t.saveEdit:t.submit}</button>
        {editingRow && <button type="button" className="secondary" onClick={resetEditor} disabled={busy||uploading}>{t.cancel}</button>}
        <button type="button" className="secondary" onClick={()=>{const url=document.querySelector('.quick-external input[name="external_watch_url"]')?.value?.trim();if(allowed(url))window.open(url,"_blank","noopener,noreferrer");else setNotice("Enter a valid NextEmbed link first.");}}>{({hy:"Փորձարկել հղումը",ru:"Проверить ссылку",en:"Test link"}[language])}</button>
      </div>
    </form><p role="status" aria-live="polite">{notice}</p>
    <div style={{marginTop:28,borderTop:"1px solid #ffffff22",paddingTop:20}}>
      <div className="panel-head"><h2>{t.list} ({externalMovies.length})</h2>
      <button type="button" className="secondary" onClick={refreshList} disabled={listLoading||busy}>{t.refresh}</button></div>
      {externalMovies.length===0 && !listLoading && <p className="hint">{t.empty}</p>}
      <div className="table-wrap"><table style={{minWidth:550}}><thead><tr><th>ID</th><th>{t.title}</th><th>URL</th><th>Status</th><th>Actions</th></tr></thead><tbody>
        {externalMovies.map(row=><tr key={row.id}>
          <td>{row.id}</td><td>{row.title_hy||row.title_ru||row.title_en}</td>
          <td><a href={row.external_watch_url} target="_blank" rel="noopener noreferrer">{row.external_watch_url?.split("/").slice(-1)[0]}</a></td>
          <td>{row.is_published?"Published":"Hidden"}</td>
          <td><div className="row-actions">
            <button className="secondary" type="button" disabled={busy||uploading} onClick={()=>beginEdit(row)}>{t.edit}</button>
            <button className="secondary" type="button" disabled={busy} onClick={()=>changeListing(row,false)}>{row.is_published?t.hide:t.show}</button>
            <button className="secondary" type="button" disabled={busy} onClick={()=>changeListing(row,true)}>{t.remove}</button>
          </div></td>
        </tr>)}
      </tbody></table></div>
    </div>
  </section>;
}
