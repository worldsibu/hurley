export function l(msg: string | Error) {
    if(typeof msg === 'string'){
        console.log(`[hurley] - ${msg}`);
    }else{
        console.log(msg);
    }
}