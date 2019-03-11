import { inspect } from 'util';
export function l(msg: string | Error) {
    if(typeof msg === 'string'){
        console.log(`[hurley] - ${msg}`);
    }else{
        // console.log(inspect(msg, { depth: 5 }));
        if((msg as any).responses && (msg as any).responses.length > 0){
            for(let response of (msg as any).responses){
                console.log(response.Error);
                console.log(response);
            }
        }
        // console.log((msg as any).responses);
        // console.log(JSON.stringify(msg, null, 4));
    }
}