// 渲染技能数据
function renderSkillData(skillData) {
    const userInfo = getUserFromArray(skillData.uid);

    // 更新用户信息
    document.getElementById('skillUserId').textContent = skillData.uid;
    document.getElementById('skillUserName').textContent = `${skillData.name || `UID:${skillData.uid}`} - Skill Breakdown`;
    document.getElementById('skillUserNickname').textContent = skillData.name;
    document.getElementById('skillUserProfession').textContent = userInfo ? userInfo.profession || '❓' : '❓';
    document.getElementById('fightPoint').textContent = userInfo ? userInfo.fightPoint || '❓' : '❓';
    document.getElementById('maxHp').textContent = skillData.attr ? skillData.attr.max_hp || '❓' : '❓';
    document.getElementById('skillCount').textContent = Object.keys(skillData.skills).length;

    // 把对象转数组并排序
    const skills = Object.entries(skillData.skills);
    const sortedSkills = skills.slice().sort(([, a], [, b]) => b.totalDamage - a.totalDamage);

    // 为图表准备三组数据
    const skillNames = []; // 用来存 displayName
    const damages = [];
    const critRates = [];
    const luckyRates = [];

    // 渲染表格
    const tableBody = document.getElementById('skillTableBody');
    tableBody.innerHTML = '';

    // 渲染表格 + 收集图表数据
    sortedSkills.forEach(([skillId, skill]) => {
        const name = skill.displayName || skillId;

        // 填表格
        const row = document.createElement('tr');
        row.innerHTML = `
                    <td>${name}</td>
                    <td>${skill.type}</td>
                    <td>${skill.elementype}</td>
                    <td>${skill.totalDamage.toLocaleString()}</td>
                    <td>${skill.totalCount}</td>
                    <td class="skill-crit">${(skill.critRate * 100).toFixed(2)}%</td>
                    <td class="skill-lucky">${(skill.luckyRate * 100).toFixed(2)}%</td>
                    <td>${(skill.damageBreakdown.critical + skill.damageBreakdown.crit_lucky).toLocaleString()}</td>
                    <td>${(skill.damageBreakdown.normal + skill.damageBreakdown.lucky).toLocaleString()}</td>
                `;
        tableBody.appendChild(row);

        // 收集给图表的数据
        skillNames.push(name);
        damages.push(skill.totalDamage);
        critRates.push(skill.critRate * 100);
        luckyRates.push(skill.luckyRate * 100);
    });

    renderSkillCharts(skillNames, damages, critRates, luckyRates);
}

// 渲染技能图表
function renderSkillCharts(skillIds, damages, critRates, luckyRates) {
    const topNames = skillIds.slice(0, 5);
    const topDamages = damages.slice(0, 5);
    const topAllDamages = topDamages.reduce((a, b) => a + b, 0);
    const allDamages = damages.reduce((a, b) => a + b, 0);
    const otherDamages = allDamages - topAllDamages;

    // Ensure containers stack vertically
    const statsContainer = document.querySelector('.skill-stats-container');
    if (statsContainer) {
        statsContainer.style.display = 'flex';
        statsContainer.style.flexDirection = 'column'; // stack on top of each other
        statsContainer.style.gap = '12px';
        statsContainer.style.alignItems = 'stretch';
    }

    // Ensure each chart container takes full width and a reasonable height
    const dmgEl = document.getElementById('skillDamageChart');
    const critEl = document.getElementById('skillCritChart');
    if (dmgEl) {
        dmgEl.style.width = '100%';
        dmgEl.style.height = '260px';
    }
    if (critEl) {
        critEl.style.width = '100%';
        critEl.style.height = '500px';
    }

    // 构造前 5 的 data，并且都显示标签
    const pieData = topNames.map((name, idx) => ({
        value: topDamages[idx],
        name: name,
        label: {
            show: true,
            position: 'outside',
            formatter: '{b}\n{d}%',
        },
        labelLine: { show: true },
    }));
    pieData.push({
        value: otherDamages,
        name: 'Other',
        label: { show: true, position: 'outside', formatter: '{b}\n{d}%' },
        labelLine: { show: true },
    });

    // 销毁现有图表
    if (skillChart1) {
        try {
            skillChart1.dispose();
        } catch (e) {}
        skillChart1 = null;
    }
    if (skillChart2) {
        try {
            skillChart2.dispose();
        } catch (e) {}
        skillChart2 = null;
    }

    // 创建新的图表实例
    skillChart1 = echarts.init(document.getElementById('skillDamageChart'));
    skillChart2 = echarts.init(document.getElementById('skillCritChart'));

    // 技能数值分布图
    const damageOption = {
        title: {
            text: 'Skill Breakdown',
            left: 'center',
            textStyle: { color: '#e2e8f0' },
        },
        tooltip: {
            trigger: 'item',
            formatter: '{b}: {c} ({d}%)',
            backgroundColor: 'rgba(40, 40, 60, 0.9)',
            borderColor: '#3498db',
            textStyle: { color: '#FFFFFF' },
        },
        // legend: {
        //     orient: 'vertical',
        //     right: 10,
        //     top: 'center',
        //     textStyle: { color: '#cbd5e0' },
        // },
        series: [
            {
                name: 'Skill Stats',
                type: 'pie',
                radius: ['40%', '70%'],
                avoidLabelOverlap: false,
                itemStyle: {
                    borderRadius: 10,
                    borderColor: '#1a2a6c',
                    borderWidth: 2,
                },
                label: { show: false, position: 'center', color: '#FFFFFF' },
                emphasis: {
                    label: { show: true, fontSize: '20px' },
                },
                data: pieData,
            },
        ],
    };

    // Crit Rate/Luck Rate对比图
    const critOption = {
        title: {
            text: 'Crit Rate & Luck Rate',
            left: 'center',
            textStyle: { color: '#e2e8f0' },
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            backgroundColor: 'rgba(40, 40, 60, 0.9)',
            borderColor: '#3498db',
            textStyle: { color: '#ecf0f1' },
        },
        legend: {
            data: ['Crit Rate', 'Luck Rate'],
            bottom: 6,
            textStyle: { color: '#cbd5e0' },
        },
        grid: {
            left: '4%',
            right: '4%',
            bottom: '20%',
            top: '14%',
            containLabel: true,
        },
        xAxis: {
            type: 'category',
            data: skillIds.map((id) => `${id}`),
            axisLine: { lineStyle: { color: '#7f8c8d' } },
            axisLabel: { color: '#95a5a6', interval: 0, rotate: 45 },
        },
        yAxis: {
            type: 'value',
            name: '%',
            min: 0,
            max: 100,
            axisLine: { lineStyle: { color: '#7f8c8d' } },
            axisLabel: { color: '#95a5a6' },
            splitLine: { lineStyle: { color: 'rgba(127, 140, 141, 0.2)' } },
        },
        series: [
            { name: 'Crit Rate', type: 'bar', data: critRates, itemStyle: { color: '#ff9966' } },
            { name: 'Luck Rate', type: 'bar', data: luckyRates, itemStyle: { color: '#93f9b9' } },
        ],
    };

    skillChart1.setOption(damageOption);
    skillChart2.setOption(critOption);

    // 单一 resize handler，避免重复绑定
    if (window.__skill_resize_handler) {
        window.removeEventListener('resize', window.__skill_resize_handler);
    }
    window.__skill_resize_handler = function () {
        try {
            skillChart1 && skillChart1.resize();
        } catch (e) {}
        try {
            skillChart2 && skillChart2.resize();
        } catch (e) {}
    };
    window.addEventListener('resize', window.__skill_resize_handler);
}

// 生成表格行
function updateTables(visibleUserArray) {
    const damageTable = document.getElementById('damageTable').querySelector('tbody');
    //获取damageTable里的所有行
    let existingRows = damageTable.querySelectorAll('tr');
    if (existingRows.length > visibleUserArray.length) {
        // 移除多余的行
        for (let i = existingRows.length - 1; i >= visibleUserArray.length; i--) {
            damageTable.removeChild(existingRows[i]);
        }
    }
    if (existingRows.length < visibleUserArray.length) {
        // 添加新行
        for (let i = existingRows.length; i < visibleUserArray.length; i++) {
            const row = document.createElement('tr');
            damageTable.appendChild(row);
        }
    }
    existingRows = damageTable.querySelectorAll('tr');

    for (let i = 0; i < visibleUserArray.length; i++) {
        const user = visibleUserArray[i];
        const crit_rate = user.total_count.critical / user.total_count.total;
        const lucky_rate = user.total_count.lucky / user.total_count.total;

        const row = existingRows[i];

        const isSimpleMode = document.body.classList.contains('simple-mode');

        // 其他数据列
        const otherCells = [
            user.profession || '❓',
            Number(user.fightPoint).toLocaleString(),
            (user.hp ?? '❓').toLocaleString(),
            Number(user.taken_damage).toLocaleString(),
            user.dead_count ?? '❓',
            `${(crit_rate * 100).toFixed(2)}%`,
            `${(lucky_rate * 100).toFixed(2)}%`,
        ];
        if (currentDataGroup === 'damage' || currentDataGroup === 'all') {
            otherCells.push(Number(user.total_damage.total).toLocaleString());
            if (!isSimpleMode) {
                otherCells.push(
                    Number(user.total_damage.critical).toLocaleString(),
                    Number(user.total_damage.lucky).toLocaleString(),
                    Number(user.total_damage.crit_lucky).toLocaleString(),
                );
            }
            otherCells.push(
                Number(user.realtime_dps).toLocaleString(),
                Number(user.realtime_dps_max).toLocaleString(),
                Number(user.total_dps.toFixed(2)).toLocaleString(),
            );
        }
        if (currentDataGroup === 'healing' || currentDataGroup === 'all') {
            otherCells.push(Number(user.total_healing.total).toLocaleString());
            if (!isSimpleMode) {
                otherCells.push(
                    Number(user.total_healing.critical).toLocaleString(),
                    Number(user.total_healing.lucky).toLocaleString(),
                    Number(user.total_healing.crit_lucky).toLocaleString(),
                );
            }
            otherCells.push(
                Number(user.realtime_hps).toLocaleString(),
                Number(user.realtime_hps_max).toLocaleString(),
                Number(user.total_hps.toFixed(2)).toLocaleString(),
            );
        }
        let existingCells = row.querySelectorAll('td');
        //所需展示的列数
        const requiredColumnCount = 3 + otherCells.length;
        if (existingCells.length > requiredColumnCount) {
            // 移除多余的单元格
            for (let j = existingCells.length - 1; j >= requiredColumnCount; j--) {
                row.removeChild(existingCells[j]);
            }
        }
        if (existingCells.length < requiredColumnCount) {
            // 添加新单元格
            for (let j = existingCells.length; j < requiredColumnCount; j++) {
                const cell = document.createElement('td');
                row.appendChild(cell);
            }
        }
        existingCells = row.querySelectorAll('td');
        // 更新单元格内容
        existingCells.forEach((cell, index) => {
            if (index < 2) return;
            if (otherCells[index - 2] !== undefined) {
                cell.textContent = otherCells[index - 2];
            }
        });

        // 角色ID列
        const uidCell = existingCells[0];
        uidCell.textContent = `${user.id}`;

        // 角色昵称列
        const nicknameCell = existingCells[1];
        // Check if user.name is a non-empty string
        const hasValidName = user.name && user.name.trim() !== '';
        const nickname = userNicknames[user.id] || (hasValidName ? user.name : '');

        nicknameCell.textContent = nickname;
        const operationCell = existingCells[existingCells.length - 1];
        if (operationCell.querySelector('.skill-btn')) {
            // 如果已经存在技能按钮，则只更新用户ID
            operationCell.querySelector('.skill-btn').setAttribute('data-user-id', user.id);
            operationCell.querySelector('.copy-btn').setAttribute('data-user-id', user.id);
        } else {
            operationCell.innerHTML = '';
            const operationDiv = document.createElement('div');
            operationDiv.className = 'operation-div';
            operationCell.appendChild(operationDiv);

            // 创建复制按钮
            const copyButton = document.createElement('button');
            copyButton.className = 'copy-btn';
            copyButton.innerHTML = '<i class="icon">📋</i> Copy Data';
            copyButton.setAttribute('data-user-id', user.id);
            operationDiv.appendChild(copyButton);

            // 创建技能按钮
            const skillButton = document.createElement('button');
            skillButton.className = 'skill-btn';
            skillButton.innerHTML = '<i class="icon">📊</i> Skill Breakdown';
            skillButton.setAttribute('data-user-id', user.id);
            operationDiv.appendChild(skillButton);
        }
    }
    updateTableStickyHeader();
    // 应用列显示设置
    if (typeof applyColumnVisibility === 'function') {
        applyColumnVisibility();
    }
}

// 打开列设置弹窗
function openColumnSettings() {
    generateColumnSettingsContent();
    document.getElementById('columnSettingsModal').style.display = 'flex';
}

// 关闭列设置弹窗
function closeColumnSettings() {
    document.getElementById('columnSettingsModal').style.display = 'none';
}

// 动态生成列设置内容
function generateColumnSettingsContent() {
    const modal = document.getElementById('columnSettingsModal');
    const content = modal.querySelector('.column-settings-content');

    // 清除现有内容（保留标题）
    const existingGroups = content.querySelectorAll('.column-group');
    existingGroups.forEach((group) => group.remove());

    const isSimpleMode = document.body.classList.contains('simple-mode');

    // 基础信息组
    const baseGroup = createColumnGroup('🔰 Basic Info', [
        { id: 'uid', label: 'Player ID', column: 'uid' },
        { id: 'nickname', label: 'Player Nickname', column: 'nickname' },
        { id: 'job', label: 'Class', column: 'job' },
        { id: 'score', label: 'Ability Score', column: 'score' },
        { id: 'hp', label: 'HP', column: 'hp' },
        { id: 'takenDamage', label: 'Damage Taken', column: 'takenDamage' },
        { id: 'deadCount', label: 'Deaths', column: 'deadCount' },
        { id: 'critRate', label: 'Critical Hit Rate', column: 'critRate' },
        { id: 'luckyRate', label: 'Lucky Hit Rate', column: 'luckyRate' },
    ]);

    content.appendChild(baseGroup);

    // 根据当前数据组显示相应的列设置
    if (currentDataGroup === 'damage' || currentDataGroup === 'all') {
        // Damage data group
        const damageOptions = [{ id: 'totalDamage', label: 'Total Damage', column: 'totalDamage' }];

        if (!isSimpleMode) {
            damageOptions.push(
                { id: 'pureCrit', label: 'Pure Crit', column: 'pureCrit' },
                { id: 'pureLucky', label: 'Pure Lucky', column: 'pureLucky' },
                { id: 'critLucky', label: 'Crit & Lucky', column: 'critLucky' },
            );
        }

        const damageGroup = createColumnGroup('⚔️ Damage Data', damageOptions);
        content.appendChild(damageGroup);

        // DPS data group
        const dpsGroup = createColumnGroup('⚡ DPS Data', [
            { id: 'realtimeDps', label: 'Instant DPS', column: 'realtimeDps' },
            { id: 'realtimeDpsMax', label: 'Max Instant', column: 'realtimeDpsMax' },
            { id: 'dps', label: 'Total DPS', column: 'dps' },
        ]);
        content.appendChild(dpsGroup);
    }

    if (currentDataGroup === 'healing' || currentDataGroup === 'all') {
        // Healing data group
        const healingOptions = [{ id: 'totalHealing', label: 'Total Healing', column: 'totalHealing' }];

        if (!isSimpleMode) {
            healingOptions.push(
                { id: 'healingPureCrit', label: 'Pure Crit', column: 'healingPureCrit' },
                { id: 'healingPureLucky', label: 'Pure Lucky', column: 'healingPureLucky' },
                { id: 'healingCritLucky', label: 'Crit & Lucky', column: 'healingCritLucky' },
            );
        }

        const healingGroup = createColumnGroup('❤️ Healing Data', healingOptions);
        content.appendChild(healingGroup);

        // HPS data group
        const hpsGroup = createColumnGroup('💚 HPS Data', [
            { id: 'realtimeHps', label: 'Instant HPS', column: 'realtimeHps' },
            { id: 'realtimeHpsMax', label: 'Max Instant', column: 'realtimeHpsMax' },
            { id: 'hps', label: 'Total HPS', column: 'hps' },
        ]);
        content.appendChild(hpsGroup);
    }

    // Other group
    const otherGroup = createColumnGroup('🔧 Others', [{ id: 'actions', label: 'Actions', column: 'actions' }]);
    content.appendChild(otherGroup);

    // Rebind events
    initColumnSettings();
}

// 创建列设置组
function createColumnGroup(title, options) {
    const group = document.createElement('div');
    group.className = 'column-group';

    const groupTitle = document.createElement('div');
    groupTitle.className = 'column-group-title';
    groupTitle.textContent = title;
    group.appendChild(groupTitle);

    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'column-options';

    options.forEach((option) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'column-option';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `col-${option.id}`;
        checkbox.setAttribute('data-column', option.column);
        checkbox.checked = columnVisibility[option.column] || false;

        const label = document.createElement('label');
        label.setAttribute('for', `col-${option.id}`);
        label.textContent = option.label;

        optionDiv.appendChild(checkbox);
        optionDiv.appendChild(label);
        optionsContainer.appendChild(optionDiv);
    });

    group.appendChild(optionsContainer);
    return group;
}

// 应用列显示设置
function applyColumnVisibility() {
    const table = document.getElementById('damageTable');
    if (!table) return;

    // 基础信息列（rowspan=2）
    const baseColumns = [
        { column: 'uid', selector: 'th[title="角色唯一标识符"]' },
        { column: 'nickname', selector: 'th[title="角色昵称/自定义昵称"]' },
        { column: 'job', selector: 'th[title="角色职业"]' },
        { column: 'score', selector: 'th[title="角色评分"]' },
        { column: 'hp', selector: 'th[title="角色血量"]' },
        { column: 'takenDamage', selector: 'th[title="角色在战斗中受到的伤害"]' },
        { column: 'deadCount', selector: 'th[title="角色在战斗中死亡次数"]' },
        { column: 'critRate', selector: 'th[title="角色在战斗中的暴击伤害次数占总伤害次数的比例"]' },
        { column: 'luckyRate', selector: 'th[title="角色在战斗中的幸运伤害次数占总伤害次数的比例"]' },
    ];

    // 应用基础列的显示/隐藏
    baseColumns.forEach(({ column, selector }) => {
        const isVisible = columnVisibility[column];
        const headerCell = table.querySelector(selector);
        if (headerCell) {
            if (isVisible) {
                headerCell.style.removeProperty('display');
            } else {
                headerCell.style.setProperty('display', 'none', 'important');
            }
        }
    });

    // 伤害相关列
    const damageColumns = [
        { column: 'totalDamage', selector: 'th[title="角色在战斗中造成的总伤害"]' },
        { column: 'pureCrit', selector: 'th[title="角色在战斗中造成的非幸运的暴击伤害"]' },
        { column: 'pureLucky', selector: 'th[title="角色在战斗中造成的非暴击的幸运伤害"]' },
        { column: 'critLucky', selector: 'th[title="角色在战斗中造成的暴击的幸运伤害"]' },
    ];

    damageColumns.forEach(({ column, selector }) => {
        const isVisible = columnVisibility[column];
        const headerCell = table.querySelector(selector);
        if (headerCell) {
            if (isVisible) {
                headerCell.style.removeProperty('display');
            } else {
                headerCell.style.setProperty('display', 'none', 'important');
            }
        }
    });

    // DPS相关列
    const dpsColumns = [
        { column: 'realtimeDps', selector: 'th[title="角色在战斗中的最近一秒造成的伤害"]' },
        { column: 'realtimeDpsMax', selector: 'th[title="角色在战斗中的最大瞬时DPS"]' },
        { column: 'dps', selector: 'th[title="角色在战斗中的总DPS（以第一次技能与最后一次技能之间的时间作为有效战斗时间计算）"]' },
    ];

    dpsColumns.forEach(({ column, selector }) => {
        const isVisible = columnVisibility[column];
        const headerCell = table.querySelector(selector);
        if (headerCell) {
            if (isVisible) {
                headerCell.style.removeProperty('display');
            } else {
                headerCell.style.setProperty('display', 'none', 'important');
            }
        }
    });

    // 治疗相关列
    const healingColumns = [
        { column: 'totalHealing', selector: 'th[title="角色在战斗中造成的总治疗量"]' },
        { column: 'healingPureCrit', selector: 'th[title="角色在战斗中造成的非幸运的暴击治疗量"]' },
        { column: 'healingPureLucky', selector: 'th[title="角色在战斗中造成的非暴击的幸运治疗量"]' },
        { column: 'healingCritLucky', selector: 'th[title="角色在战斗中造成的暴击的幸运治疗量"]' },
    ];

    healingColumns.forEach(({ column, selector }) => {
        const isVisible = columnVisibility[column];
        const headerCell = table.querySelector(selector);
        if (headerCell) {
            if (isVisible) {
                headerCell.style.removeProperty('display');
            } else {
                headerCell.style.setProperty('display', 'none', 'important');
            }
        }
    });

    // HPS相关列
    const hpsColumns = [
        { column: 'realtimeHps', selector: 'th[title="角色在战斗中的最近一秒造成的伤害和治疗量"]' },
        { column: 'realtimeHpsMax', selector: 'th[title="角色在战斗中的最大瞬时HPS"]' },
        { column: 'hps', selector: 'th[title="角色在战斗中的总HPS（以第一次技能与最后一次技能之间的时间作为有效战斗时间计算）"]' },
    ];

    hpsColumns.forEach(({ column, selector }) => {
        const isVisible = columnVisibility[column];
        const headerCell = table.querySelector(selector);
        if (headerCell) {
            if (isVisible) {
                headerCell.style.removeProperty('display');
            } else {
                headerCell.style.setProperty('display', 'none', 'important');
            }
        }
    });

    // 操作列
    const actionsHeader = table.querySelector('th:last-child');
    if (actionsHeader && actionsHeader.textContent.includes('操作')) {
        if (columnVisibility.actions) {
            actionsHeader.style.removeProperty('display');
        } else {
            actionsHeader.style.setProperty('display', 'none', 'important');
        }
    }

    // 应用表体单元格的显示/隐藏
    applyBodyColumnVisibility();

    // 更新colspan
    updateColspan();
}

// 应用表体单元格的显示/隐藏
function applyBodyColumnVisibility() {
    const table = document.getElementById('damageTable');
    if (!table) return;

    // 获取所有表体行
    const rows = table.querySelectorAll('tbody tr');

    rows.forEach((row) => {
        const cells = row.querySelectorAll('td');

        // 基础信息列 (0-8)
        const baseCols = ['uid', 'nickname', 'job', 'score', 'hp', 'takenDamage', 'deadCount', 'critRate', 'luckyRate'];
        baseCols.forEach((col, index) => {
            if (cells[index]) {
                if (columnVisibility[col]) {
                    cells[index].style.removeProperty('display');
                } else {
                    cells[index].style.setProperty('display', 'none', 'important');
                }
            }
        });

        // 动态列需要根据当前数据组和简洁模式来确定位置
        let cellIndex = 9; // 从第10列开始

        // 处理伤害相关列
        if (currentDataGroup === 'damage' || currentDataGroup === 'all') {
            // 总伤害列
            if (cells[cellIndex]) {
                if (columnVisibility.totalDamage) {
                    cells[cellIndex].style.removeProperty('display');
                } else {
                    cells[cellIndex].style.setProperty('display', 'none', 'important');
                }
            }
            cellIndex++;

            // 详细伤害列（非简洁模式）
            if (!document.body.classList.contains('simple-mode')) {
                const detailCols = ['pureCrit', 'pureLucky', 'critLucky'];
                detailCols.forEach((col) => {
                    if (cells[cellIndex]) {
                        if (columnVisibility[col]) {
                            cells[cellIndex].style.removeProperty('display');
                        } else {
                            cells[cellIndex].style.setProperty('display', 'none', 'important');
                        }
                    }
                    cellIndex++;
                });
            }

            // DPS列
            const dpsCols = ['realtimeDps', 'realtimeDpsMax', 'dps'];
            dpsCols.forEach((col) => {
                if (cells[cellIndex]) {
                    if (columnVisibility[col]) {
                        cells[cellIndex].style.removeProperty('display');
                    } else {
                        cells[cellIndex].style.setProperty('display', 'none', 'important');
                    }
                }
                cellIndex++;
            });
        }

        // 处理治疗相关列
        if (currentDataGroup === 'healing' || currentDataGroup === 'all') {
            // 总治疗列
            if (cells[cellIndex]) {
                if (columnVisibility.totalHealing) {
                    cells[cellIndex].style.removeProperty('display');
                } else {
                    cells[cellIndex].style.setProperty('display', 'none', 'important');
                }
            }
            cellIndex++;

            // 详细治疗列（非简洁模式）
            if (!document.body.classList.contains('simple-mode')) {
                const healingDetailCols = ['healingPureCrit', 'healingPureLucky', 'healingCritLucky'];
                healingDetailCols.forEach((col) => {
                    if (cells[cellIndex]) {
                        if (columnVisibility[col]) {
                            cells[cellIndex].style.removeProperty('display');
                        } else {
                            cells[cellIndex].style.setProperty('display', 'none', 'important');
                        }
                    }
                    cellIndex++;
                });
            }

            // HPS列
            const hpsCols = ['realtimeHps', 'realtimeHpsMax', 'hps'];
            hpsCols.forEach((col) => {
                if (cells[cellIndex]) {
                    if (columnVisibility[col]) {
                        cells[cellIndex].style.removeProperty('display');
                    } else {
                        cells[cellIndex].style.setProperty('display', 'none', 'important');
                    }
                }
                cellIndex++;
            });
        }

        // 操作列（最后一列）
        const lastCell = cells[cells.length - 1];
        if (lastCell) {
            if (columnVisibility.actions) {
                lastCell.style.removeProperty('display');
            } else {
                lastCell.style.setProperty('display', 'none', 'important');
            }
        }
    });
}

// 更新表头的colspan
function updateColspan() {
    const table = document.getElementById('damageTable');
    if (!table) return;

    // 计算各组可见列数
    const damageMainVisible = ['totalDamage', 'pureCrit', 'pureLucky', 'critLucky'].filter((col) => columnVisibility[col]).length;
    const dpsVisible = ['realtimeDps', 'realtimeDpsMax', 'dps'].filter((col) => columnVisibility[col]).length;
    const healingMainVisible = ['totalHealing', 'healingPureCrit', 'healingPureLucky', 'healingCritLucky'].filter(
        (col) => columnVisibility[col],
    ).length;
    const hpsVisible = ['realtimeHps', 'realtimeHpsMax', 'hps'].filter((col) => columnVisibility[col]).length;

    // 更新colspan
    const damageMainHeader = table.querySelector('.damage-main-col');
    const dpsHeader = table.querySelector('.dps-col');
    const healingMainHeader = table.querySelector('.healing-main-col');
    const hpsHeader = table.querySelector('.hps-col');

    if (damageMainHeader) {
        if (damageMainVisible > 0) {
            damageMainHeader.setAttribute('colspan', damageMainVisible);
            damageMainHeader.style.removeProperty('display');
        } else {
            damageMainHeader.style.setProperty('display', 'none', 'important');
        }
    }

    if (dpsHeader) {
        if (dpsVisible > 0) {
            dpsHeader.setAttribute('colspan', dpsVisible);
            dpsHeader.style.removeProperty('display');
        } else {
            dpsHeader.style.setProperty('display', 'none', 'important');
        }
    }

    if (healingMainHeader) {
        if (healingMainVisible > 0) {
            healingMainHeader.setAttribute('colspan', healingMainVisible);
            healingMainHeader.style.removeProperty('display');
        } else {
            healingMainHeader.style.setProperty('display', 'none', 'important');
        }
    }

    if (hpsHeader) {
        if (hpsVisible > 0) {
            hpsHeader.setAttribute('colspan', hpsVisible);
            hpsHeader.style.removeProperty('display');
        } else {
            hpsHeader.style.setProperty('display', 'none', 'important');
        }
    }
}
