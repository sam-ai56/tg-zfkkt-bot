// last link
var from;
// link where we want to go
var to;

var callback_data = "";
var data = [];


module.exports = {
    from,
    to,
    callback_data,
    data,
    gen_link(_from, _to){
        return `${_from}:${_to}`
    },
    back_button(_to, object = false){
        if (object)
            return {
                text: 'Назад',
                callback_data: gen_link(_to),
            };
    
        return [
            [
                {
                    text: 'Назад',
                    callback_data: gen_link(_to),
                }
            ]
        ];
    }
}