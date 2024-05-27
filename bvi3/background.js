async function fetchEasyList() {
    try {
        const response = await fetch('https://easylist.to/easylist/easylist.txt');
        if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
        const easyListText = await response.text();
        return easyListText.split('\n').filter(line => line && !line.startsWith('!') && !line.startsWith('['));
    } catch (error) {
        console.error('Failed to fetch EasyList:', error);
        return [];
    }
}

function parseEasyList(easyList) {
    const rules = [];
    let id = 1;

    easyList.forEach(rule => {
        if (rule.startsWith('||')) {
            const urlFilter = rule.replace('||', '*://*');
            rules.push({
                id: id++,
                priority: 1,
                action: { type: 'block' },
                condition: { urlFilter: urlFilter }
            });
        } else if (rule.startsWith('|http')) {
            const urlFilter = rule.replace('|', '');
            rules.push({
                id: id++,
                priority: 1,
                action: { type: 'block' },
                condition: { urlFilter: urlFilter }
            });
        } else if (rule.startsWith('@@||')) {
            const urlFilter = rule.replace('@@||', '*://*');
            rules.push({
                id: id++,
                priority: 1,
                action: { type: 'allow' },
                condition: { urlFilter: urlFilter }
            });
        }
    });

    return rules;
}

async function updateRules() {
    const easyList = await fetchEasyList();
    const rules = parseEasyList(easyList);
    chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: rules.map(rule => rule.id),
        addRules: rules
    });
}

chrome.runtime.onInstalled.addListener(updateRules);
chrome.runtime.onStartup.addListener(updateRules);
