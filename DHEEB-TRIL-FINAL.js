/**
 * ═══════════════════════════════════════════════════════════════
 *  DHEEB TRIL - Alpha Zero Edition
 *  Complete Trading Framework
 * ═══════════════════════════════════════════════════════════════
 */

const DHEEB = {
    // ============================================
    // ACCOUNT CONFIG
    // ============================================
    ACCOUNT: {
        balance: 50000,
        profitTarget: 3000,        // 6%
        maxDrawdown: 2000,          // 4% trailing
        dailyLossGuard: 1000,        // HARD STOP
    },

    // ============================================
    // POSITION SIZING
    // ============================================
    CONTRACTS: {
        NQ: { max: 3, pricePerPt: 5 },
        MNQ: { max: 30, pricePerPt: 0.50 }
    },

    // ============================================
    // RISK RULES
    // ============================================
    RISK: {
        defaultMax: 300,            // 30% of daily
        aPlusMax: 500,              // A+ setup only
        absoluteMax: 990,           // 99% daily
        maxSLPoints: 66
    },

    // ============================================
    // DAILY STATUS
    // ============================================
    getStatus(currentBalance, todayPnl, trades) {
        const buffer = currentBalance - (50000 - 2000);
        const dailyUsed = Math.abs(todayPnl);
        
        let bufferStatus = 'SAFE';
        let dailyStatus = 'GREEN';

        // Buffer check
        if (buffer < 200) bufferStatus = 'LOCK';
        else if (buffer < 500) bufferStatus = '10%';
        else if (buffer < 1000) bufferStatus = '20%';

        // Daily check
        if (dailyUsed >= 1000) dailyStatus = 'RED';
        else if (dailyUsed >= 500) dailyStatus = 'ORANGE';
        else if (dailyUsed >= 300) dailyStatus = 'YELLOW';

        return { bufferStatus, dailyStatus, buffer, dailyUsed };
    },

    // ============================================
    // CALCULATE CONTRACTS
    // ============================================
    calculateContracts(symbol, slPoints, probability = 50) {
        const contract = this.CONTRACTS[symbol];
        if (!contract) return { error: 'Invalid symbol' };

        const maxRisk = this.RISK.defaultMax;
        const contracts = Math.floor(maxRisk / (slPoints * contract.pricePerPt));
        
        return {
            symbol,
            slPoints,
            pricePerPt: contract.pricePerPt,
            contracts,
            risk: contracts * slPoints * contract.pricePerPt,
            maxContracts: contract.max,
            actualContracts: Math.min(contracts, contract.max)
        };
    },

    // ============================================
    // FORMAT TRIL OUTPUT
    // ============================================
    formatTRIL(data) {
        const {
            symbol = 'MNQ',
            direction = 'NEUTRAL',
            setupType = 'INTRADAY',  // SCALP, INTRADAY, SWING
            timeframe = '15m',         // 1m, 5m, 15m, 1H
            entry,
            sl,
            tp1,
            tp2,
            probability = 50,
            session,
            sd1, sd2, sd3,
            asianHigh, asianLow,
            londonHigh, londonLow,
            nyHigh, nyLow,
            currentBalance = 50000,
            todayPnl = 0,
            trades = 0
        } = data;

        // Calculate status
        const status = this.getStatus(currentBalance, todayPnl, trades);
        
        // Calculate contracts
        const slPoints = sl && entry ? Math.abs(parseFloat(sl) - parseFloat(entry)) : 0;
        const calc = this.calculateContracts(symbol, slPoints, probability);
        
        const dirEmoji = direction === 'BUY' ? '🟢' : direction === 'SELL' ? '🔴' : '⚪';

        // Build output
        let output = `🐺 DHEEB: ${symbol} #${trades + 1}\n`;
        output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        
        // Status
        output += `P&L Today: $${todayPnl} | Trades: ${trades}/2\n`;
        output += `Buffer: ${status.bufferStatus} | Daily: ${status.dailyStatus}\n`;
        output += `Setup: ${setupType} | TF: ${timeframe}\n`;
        output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        
        // Session Liquidity
        if (asianHigh || londonHigh) {
            output += `SESSION LIQUIDITY\n`;
            if (asianHigh) output += `Asian: ${asianHigh} - ${asianLow}\n`;
            if (londonHigh) output += `London: ${londonHigh} - ${londonLow}\n`;
            if (nyHigh) output += `NY: ${nyHigh} - ${nyLow}\n`;
            output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        }
        
        // SD Levels
        if (sd1) {
            output += `SD LEVELS\n`;
            if (sd1) output += `SD1: ${sd1}\n`;
            if (sd2) output += `SD2: ${sd2}\n`;
            if (sd3) output += `SD3: ${sd3}\n`;
            output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        }
        
        // Entry Levels
        if (entry && sl) {
            output += `📍 Entry: ${entry}\n`;
            output += `🚫 SL: ${sl} (${slPoints} pts)\n`;
            if (tp1) output += `🎯 TP1: ${tp1}\n`;
            if (tp2) output += `🎯 TP2: ${tp2}\n`;
            
            const tpDist = tp1 ? Math.abs(parseFloat(tp1) - parseFloat(entry)) : 0;
            const rrr = slPoints > 0 ? (tpDist / slPoints).toFixed(1) : '?';
            
            output += `RRR: 1:${rrr}\n`;
            output += `Size: ${calc.actualContracts} ${symbol}\n`;
            output += `Risk: $${calc.risk} (${((calc.risk/1000)*100).toFixed(0)}% daily)\n`;
            output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        }
        
        // Decision
        const allowed = this.checkConditions(data);
        
        if (allowed) {
            output += `✅ DECISION: ALLOWED\n`;
            output += `Execute or stand down.\n`;
        } else {
            output += `❌ DECISION: NOT ALLOWED\n`;
            output += `${data.failReason || 'Failed conditions'}\n`;
            output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
            output += `STAND DOWN.\n`;
        }
        
        return output;
    },

    // ============================================
    // CHECK 7 CONDITIONS
    // ============================================
    checkConditions(data) {
        // Get current status
        const status = this.getStatus(data.currentBalance || 50000, data.todayPnl || 0, data.trades || 0);
        
        const conditions = [
            { name: 'Liquidity Sweep', check: data.liquiditySwept },
            { name: 'Displacement', check: data.displacement },
            { name: 'FVG/OB + MSS', check: data.fvgOrOB && data.mSS },
            { name: 'Liquidity Target', check: data.target },
            { name: 'RRR ≥ 2.0', check: parseFloat(data.rrr) >= 2.0 },
            { name: 'Kill Zone', check: data.session === 'LONDON' || data.session === 'NY' },
            { name: 'Buffer Safe', check: status.bufferStatus === 'SAFE' || status.bufferStatus === '20%' }
        ];

        const failed = conditions.find(c => !c.check);
        
        if (failed) {
            data.failReason = `Failed: ${failed.name}`;
            return false;
        }
        
        return true;
    },

    // ============================================
    // PRE-TRADE GATE
    // ============================================
    preTradeCheck(state, detached) {
        if (state < 8 || detached !== 'Y') {
            return {
                allowed: false,
                reason: 'Psychology Gate Failed'
            };
        }
        return { allowed: true };
    }
};

module.exports = DHEEB;
