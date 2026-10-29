export function normalizeProgress(value,books) {
  const input=value && typeof value==='object' ? value : {};
  return Object.fromEntries(books.map(book=>{
    const entry=Object.hasOwn(input,book.id) && input[book.id] && typeof input[book.id]==='object' ? input[book.id] : {};
    const page=Number.isInteger(entry.page) ? Math.max(0,Math.min(book.pages.length-1,entry.page)) : 0;
    return [book.id,{page,finished:entry.finished===true && page===book.pages.length-1}];
  }));
}
export function openingPage(progress,book) {
  const entry=progress[book.id];
  return entry?.finished ? 0 : Math.max(0,Math.min(book.pages.length-1,entry?.page||0));
}
export function rememberPage(progress,book,index,finished=false) {
  const page=Number.isInteger(index) ? Math.max(0,Math.min(book.pages.length-1,index)) : 0;
  progress[book.id]={page,finished:finished && page===book.pages.length-1};
}
export function effectiveSettings(settings) {
  return settings.quiet ? {...settings,narration:false,sound:false,music:false} : settings;
}
