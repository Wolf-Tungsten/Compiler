const { processRegexEscape } = require('./formalize')
// 中缀表达式转后缀表达式
function postfix(exp){
    let input = processRegexEscape(exp)
    let stack = [], output = []
    let pointer = 0
    while(pointer < input.length){
        // 运算符和左括号
        if ( input[pointer] === '*' ||
        input[pointer] === '|'  ||
        input[pointer] === '('  ||
        input[pointer] === '•'  
        ) {
            stack.push(input[pointer])
        } else if (input[pointer] === ')' && input[pointer-1] !== '\\') {
            // 右括号
            let top = stack.pop()
            while(top!=='('){
                output.push(top)
                top = stack.pop()
            }
        } else {
            output.push(input[pointer])
        }
        pointer++
    }
    while(stack.length>0){
        output.push(stack.pop())
    }
    return output
}

function thompson(postfixExp, stateBias, endName, action){
    let automaStack = []
    let stateNo = stateBias
    let pointer = 0
    while(pointer < postfixExp.length){
        // if(postfixExp[pointer]==='\\'){
        //     let startState = stateNo++
        //     let endState = stateNo++
        //     let automa = {
        //         start: `S${startState}`,
        //         end: `S${endState}`,
        //     }
        //     automa.stateList = [automa.start, automa.end]
        //     automa[automa.start] = {'ø':[]}
        //     automa[automa.end] = {'ø':[]}
        //     automa[automa.start][`\\${postfixExp[pointer+1]}`] = automa.end
        //     automaStack.push(automa)
        //     pointer += 2
        //     continue
        // }
        if(postfixExp[pointer]==='|'){
            let top_1 = automaStack.pop()
            let top_2 = automaStack.pop()
            let startState = stateNo++
            let endState = stateNo++
            let automa = {
                start: `S${startState}`,
                end: `S${endState}`
            }
            automa.stateList = ([automa.start, automa.end]).concat(top_1.stateList, top_2.stateList)
            automa[automa.start]={'ø':[top_1.start, top_2.start]}
            automa[automa.end] = {'ø':[]}
            top_1.stateList.forEach(k => {
                automa[k] = top_1[k]
            })
            top_2.stateList.forEach(k => {
                automa[k] = top_2[k]
            })
            automa[top_1.end]['ø'].push(automa.end)
            automa[top_2.end]['ø'].push(automa.end)
            automaStack.push(automa)
            pointer+=1
            continue
        }
        if(postfixExp[pointer]==='*'){
            let top = automaStack.pop()
            let startState = stateNo++
            let endState = stateNo++
            let automa = {
                start: `S${startState}`,
                end: `S${endState}`
            }
            automa.stateList = ([automa.start, automa.end]).concat(top.stateList)
            automa[automa.end] = {'ø':[]}
            automa[automa.start]={'ø':[top.start, automa.end]}
            top.stateList.forEach(k => {
                automa[k] = top[k]
            })
            automa[top.end]['ø'].push(top.start, automa.end)
            automaStack.push(automa)
            pointer+=1
            continue
        }
        if(postfixExp[pointer]==='•'){
            let top_2 = automaStack.pop()
            let top_1 = automaStack.pop()
            let startState = stateNo++
            let endState = stateNo++
            let automa = {
                start: `S${startState}`,
                end: `S${endState}`
            }
            automa.stateList = ([automa.start, automa.end]).concat(top_1.stateList, top_2.stateList)
            automa[automa.start]={'ø':[top_1.start]}
            automa[automa.end] = {'ø':[]}
            top_1.stateList.forEach(k => {
                automa[k] = top_1[k]
            })
            top_2.stateList.forEach(k => {
                automa[k] = top_2[k]
            })
            automa[top_1.end]['ø'].push(top_2.start)
            automa[top_2.end]['ø'].push(automa.end)
            automaStack.push(automa)
            pointer+=1
            continue
        }
        // 执行到此处，表明是普通字符
        let startState = stateNo++
        let endState = stateNo++
        let automa = {
            start: `S${startState}`,
            end: `S${endState}`,
        }
        automa.stateList = [automa.start, automa.end]
        automa[automa.start] = {'ø':[]}
        automa[automa.end] = {'ø':[]}
        automa[automa.start][postfixExp[pointer].slice(-1)] = automa.end // 把转译字符恢复
        automaStack.push(automa)
        pointer += 1
    }
    if(automaStack.length !== 1){
        throw Error('Thompson算法构造NFA出错')
    }
    let automa = automaStack[0]
    automa.stateList = automa.stateList.sort((a,b)=>{
        a = parseInt(a.slice(1))
        b = parseInt(b.slice(1))
        return a-b
    })
    let endState = {}
    endState[automa.end] = { name:endName, action }
    automa.end = [endState]
    automa.nextBias = stateNo
    let alphabet = {}
    automa.stateList.forEach( k => {
        let subAlphabet = Object.keys(automa[k])
        subAlphabet.forEach( l => {
            if(l!=='ø'){
                alphabet[l]=true
            }
        })
    })
    alphabet = Object.keys(alphabet)
    automa.alphabet = alphabet
    return automa
}

module.exports = {postfix, thompson}

//console.log(thompson(postfix('\\a•b'), 0, 'test'))