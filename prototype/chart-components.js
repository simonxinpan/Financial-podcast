// 交互式图表组件
class MarketChart {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.data = {
            sp500: [4780, 4775, 4785, 4790, 4788, 4756], // 模拟S&P 500数据
            volume: [3.2, 3.5, 2.8, 4.1, 3.9, 4.5], // 成交量(十亿)
            labels: ['周一', '周二', '周三', '周四', '周五', '今日']
        };
        this.init();
    }

    init() {
        this.createSVGChart();
        this.addInteractivity();
    }

    createSVGChart() {
        const width = 800;
        const height = 300;
        const margin = { top: 20, right: 30, bottom: 40, left: 60 };
        
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', height);
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        svg.style.background = 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)';
        svg.style.borderRadius = '12px';

        // 创建价格线
        const pricePoints = this.data.sp500.map((price, index) => {
            const x = margin.left + (index * (width - margin.left - margin.right)) / (this.data.sp500.length - 1);
            const y = margin.top + ((4800 - price) / 50) * (height - margin.top - margin.bottom);
            return `${x},${y}`;
        }).join(' ');

        // 价格线路径
        const priceLine = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        priceLine.setAttribute('points', pricePoints);
        priceLine.setAttribute('fill', 'none');
        priceLine.setAttribute('stroke', '#667eea');
        priceLine.setAttribute('stroke-width', '3');
        priceLine.setAttribute('stroke-linecap', 'round');
        priceLine.setAttribute('stroke-linejoin', 'round');

        // 添加渐变填充
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        gradient.setAttribute('id', 'priceGradient');
        gradient.setAttribute('x1', '0%');
        gradient.setAttribute('y1', '0%');
        gradient.setAttribute('x2', '0%');
        gradient.setAttribute('y2', '100%');

        const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop1.setAttribute('offset', '0%');
        stop1.setAttribute('stop-color', '#667eea');
        stop1.setAttribute('stop-opacity', '0.3');

        const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop2.setAttribute('offset', '100%');
        stop2.setAttribute('stop-color', '#667eea');
        stop2.setAttribute('stop-opacity', '0.05');

        gradient.appendChild(stop1);
        gradient.appendChild(stop2);
        defs.appendChild(gradient);

        // 填充区域
        const fillPath = `M ${margin.left},${height - margin.bottom} L ${pricePoints} L ${margin.left + (width - margin.left - margin.right)},${height - margin.bottom} Z`;
        const fillArea = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        fillArea.setAttribute('d', fillPath);
        fillArea.setAttribute('fill', 'url(#priceGradient)');

        // 添加数据点
        this.data.sp500.forEach((price, index) => {
            const x = margin.left + (index * (width - margin.left - margin.right)) / (this.data.sp500.length - 1);
            const y = margin.top + ((4800 - price) / 50) * (height - margin.top - margin.bottom);
            
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', x);
            circle.setAttribute('cy', y);
            circle.setAttribute('r', '5');
            circle.setAttribute('fill', '#667eea');
            circle.setAttribute('stroke', 'white');
            circle.setAttribute('stroke-width', '2');
            circle.classList.add('data-point');
            circle.setAttribute('data-price', price);
            circle.setAttribute('data-label', this.data.labels[index]);
            
            svg.appendChild(circle);
        });

        // 添加坐标轴标签
        this.data.labels.forEach((label, index) => {
            const x = margin.left + (index * (width - margin.left - margin.right)) / (this.data.labels.length - 1);
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', x);
            text.setAttribute('y', height - 10);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('font-size', '12');
            text.setAttribute('fill', '#7f8c8d');
            text.textContent = label;
            svg.appendChild(text);
        });

        svg.appendChild(defs);
        svg.appendChild(fillArea);
        svg.appendChild(priceLine);

        this.container.appendChild(svg);
    }

    addInteractivity() {
        const dataPoints = this.container.querySelectorAll('.data-point');
        const tooltip = this.createTooltip();

        dataPoints.forEach(point => {
            point.addEventListener('mouseenter', (e) => {
                const price = e.target.getAttribute('data-price');
                const label = e.target.getAttribute('data-label');
                
                tooltip.innerHTML = `
                    <div style="font-weight: 600; margin-bottom: 5px;">${label}</div>
                    <div>S&P 500: ${price}</div>
                `;
                
                tooltip.style.display = 'block';
                tooltip.style.left = e.pageX + 10 + 'px';
                tooltip.style.top = e.pageY - 10 + 'px';
                
                e.target.setAttribute('r', '8');
                e.target.style.filter = 'drop-shadow(0 4px 8px rgba(102, 126, 234, 0.4))';
            });

            point.addEventListener('mouseleave', (e) => {
                tooltip.style.display = 'none';
                e.target.setAttribute('r', '5');
                e.target.style.filter = 'none';
            });
        });
    }

    createTooltip() {
        const tooltip = document.createElement('div');
        tooltip.style.cssText = `
            position: absolute;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            pointer-events: none;
            z-index: 1000;
            display: none;
            backdrop-filter: blur(10px);
        `;
        document.body.appendChild(tooltip);
        return tooltip;
    }
}

// 成交量柱状图组件
class VolumeChart {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.data = [3.2, 3.5, 2.8, 4.1, 3.9, 4.5]; // 成交量数据
        this.labels = ['周一', '周二', '周三', '周四', '周五', '今日'];
        this.init();
    }

    init() {
        this.createBarChart();
    }

    createBarChart() {
        const width = 400;
        const height = 200;
        const margin = { top: 20, right: 20, bottom: 40, left: 40 };
        
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', height);
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        svg.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        svg.style.borderRadius = '12px';

        const maxVolume = Math.max(...this.data);
        const barWidth = (width - margin.left - margin.right) / this.data.length * 0.8;
        const barSpacing = (width - margin.left - margin.right) / this.data.length * 0.2;

        this.data.forEach((volume, index) => {
            const barHeight = (volume / maxVolume) * (height - margin.top - margin.bottom);
            const x = margin.left + index * (barWidth + barSpacing) + barSpacing / 2;
            const y = height - margin.bottom - barHeight;

            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', x);
            rect.setAttribute('y', y);
            rect.setAttribute('width', barWidth);
            rect.setAttribute('height', barHeight);
            rect.setAttribute('fill', 'rgba(255, 255, 255, 0.8)');
            rect.setAttribute('rx', '4');
            rect.classList.add('volume-bar');
            rect.setAttribute('data-volume', volume);
            rect.setAttribute('data-label', this.labels[index]);

            // 添加悬停效果
            rect.addEventListener('mouseenter', (e) => {
                e.target.setAttribute('fill', 'rgba(255, 255, 255, 1)');
                e.target.style.filter = 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2))';
            });

            rect.addEventListener('mouseleave', (e) => {
                e.target.setAttribute('fill', 'rgba(255, 255, 255, 0.8)');
                e.target.style.filter = 'none';
            });

            svg.appendChild(rect);

            // 添加标签
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', x + barWidth / 2);
            text.setAttribute('y', height - 5);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('font-size', '10');
            text.setAttribute('fill', 'rgba(255, 255, 255, 0.9)');
            text.textContent = this.labels[index];
            svg.appendChild(text);
        });

        this.container.appendChild(svg);
    }
}

// 风险指标仪表盘
class RiskGauge {
    constructor(containerId, riskLevel = 65) {
        this.container = document.getElementById(containerId);
        this.riskLevel = riskLevel; // 0-100
        this.init();
    }

    init() {
        this.createGauge();
    }

    createGauge() {
        const size = 150;
        const center = size / 2;
        const radius = 50;
        
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', size);
        svg.setAttribute('height', size);
        svg.setAttribute('viewBox', `0 0 ${size} ${size}`);

        // 背景圆弧
        const backgroundArc = this.createArc(center, center, radius, 0, 180, '#ecf0f1', 8);
        svg.appendChild(backgroundArc);

        // 风险等级圆弧
        const riskAngle = (this.riskLevel / 100) * 180;
        const riskColor = this.getRiskColor(this.riskLevel);
        const riskArc = this.createArc(center, center, radius, 0, riskAngle, riskColor, 8);
        svg.appendChild(riskArc);

        // 中心文字
        const riskText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        riskText.setAttribute('x', center);
        riskText.setAttribute('y', center + 5);
        riskText.setAttribute('text-anchor', 'middle');
        riskText.setAttribute('font-size', '18');
        riskText.setAttribute('font-weight', '600');
        riskText.setAttribute('fill', riskColor);
        riskText.textContent = `${this.riskLevel}%`;
        svg.appendChild(riskText);

        const riskLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        riskLabel.setAttribute('x', center);
        riskLabel.setAttribute('y', center + 25);
        riskLabel.setAttribute('text-anchor', 'middle');
        riskLabel.setAttribute('font-size', '12');
        riskLabel.setAttribute('fill', '#7f8c8d');
        riskLabel.textContent = '市场风险';
        svg.appendChild(riskLabel);

        this.container.appendChild(svg);
    }

    createArc(cx, cy, radius, startAngle, endAngle, color, strokeWidth) {
        const start = this.polarToCartesian(cx, cy, radius, endAngle);
        const end = this.polarToCartesian(cx, cy, radius, startAngle);
        const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
        
        const d = [
            "M", start.x, start.y, 
            "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
        ].join(" ");

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', d);
        path.setAttribute('stroke', color);
        path.setAttribute('stroke-width', strokeWidth);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke-linecap', 'round');
        
        return path;
    }

    polarToCartesian(centerX, centerY, radius, angleInDegrees) {
        const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
        return {
            x: centerX + (radius * Math.cos(angleInRadians)),
            y: centerY + (radius * Math.sin(angleInRadians))
        };
    }

    getRiskColor(level) {
        if (level < 30) return '#27ae60';
        if (level < 70) return '#f39c12';
        return '#e74c3c';
    }
}

// 初始化所有图表
document.addEventListener('DOMContentLoaded', function() {
    // 等待DOM加载完成后初始化图表
    setTimeout(() => {
        if (document.getElementById('sp500-chart')) {
            new MarketChart('sp500-chart');
        }
        if (document.getElementById('volume-chart')) {
            new VolumeChart('volume-chart');
        }
        if (document.getElementById('risk-gauge')) {
            new RiskGauge('risk-gauge', 65);
        }
    }, 100);
});