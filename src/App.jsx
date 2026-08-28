import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { MessageCircle, Send, TrendingUp, Users, DollarSign, Target, Plus, Zap, AlertTriangle, CheckCircle, TrendingDown } from 'lucide-react';

const CRMDashboard = () => {
  const [messages, setMessages] = useState([
    { id: 1, type: 'ai', content: 'こんにちは！営業データの分析や目標達成のための戦略提案をお手伝いします。現在の進捗や気になるKPIについて何でもお聞きください！' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [activeMetric, setActiveMetric] = useState(null);
  const [animateChart, setAnimateChart] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showSimulation, setShowSimulation] = useState(false);
  const [showNewMetrics, setShowNewMetrics] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const [salesData, setSalesData] = useState([
    { month: '1月', 売上実績: 850000, 売上目標: 1000000, 受注数: 12, 受注目標: 15, 新規顧客: 8 },
    { month: '2月', 売上実績: 920000, 売上目標: 1000000, 受注数: 14, 受注目標: 15, 新規顧客: 9 },
    { month: '3月', 売上実績: 1080000, 売上目標: 1000000, 受注数: 16, 受注目標: 15, 新規顧客: 11 },
    { month: '4月', 売上実績: 780000, 売上目標: 1200000, 受注数: 11, 受注目標: 18, 新規顧客: 6 },
    { month: '5月', 売上実績: 1150000, 売上目標: 1200000, 受注数: 17, 受注目標: 18, 新規顧客: 12 },
    { month: '6月', 売上実績: 980000, 売上目標: 1200000, 受注数: 14, 受注目標: 18, 新規顧客: 9 }
  ]);

  const [activityData, setActivityData] = useState([
    { 活動: 'テレアポ', 今月: 320, 目標: 400, 達成率: 80 },
    { 活動: 'メール送信', 今月: 1200, 目標: 1000, 達成率: 120 },
    { 活動: '商談', 今月: 45, 目標: 50, 達成率: 90 },
    { 活動: '提案書作成', 今月: 28, 目標: 30, 達成率: 93 },
    { 活動: 'フォローアップ', 今月: 180, 目標: 200, 達成率: 90 }
  ]);

  const [achievementData] = useState([
    { name: '売上達成率', value: 82, target: 100, color: '#ef4444' },
    { name: '受注率達成', value: 78, target: 100, color: '#f59e0b' },
    { name: '新規顧客', value: 95, target: 100, color: '#10b981' },
    { name: '活動量', value: 88, target: 100, color: '#3b82f6' }
  ]);

  const [pipelineData] = useState([
    { stage: '見込み', count: 45, amount: 2250000 },
    { stage: '提案', count: 28, amount: 4200000 },
    { stage: '商談', count: 18, amount: 5400000 },
    { stage: '稟議', count: 12, amount: 3600000 },
    { stage: '受注', count: 8, amount: 2400000 }
  ]);

  const handleMetricClick = (metric, reset) => {
    if (reset === null) {
      setActiveMetric(null);
      setPendingAction(null);
      return;
    }

    setActiveMetric(metric);

    let suggestion = '';
    let actionType = '';

    switch (metric) {
      case 'sales':
        suggestion = '売上が目標の82%となっており未達ですね。目標達成のための具体的な改善策を分析して提案しましょうか？';
        actionType = 'sales_improvement';
        break;
      case 'orders':
        suggestion = '受注数が目標の78%で未達状況です。受注率向上のための戦略を詳しく分析してみましょうか？';
        actionType = 'orders_improvement';
        break;
      case 'customers':
        suggestion = '新規顧客獲得は95%と好調ですね！この調子を維持しつつ、さらに効率化する方法を探ってみましょうか？';
        actionType = 'customer_optimization';
        break;
      case 'conversion':
        suggestion = '受注率が業界平均を下回っています。商談プロセスの詳細分析と改善案を作成しましょうか？';
        actionType = 'conversion_improvement';
        break;
      default:
        return;
    }

    const aiMessage = {
      id: messages.length + 1,
      type: 'ai',
      content: suggestion,
      hasActions: true,
      actionType: actionType
    };

    setMessages(prev => [...prev, aiMessage]);
    setPendingAction(actionType);
  };

  const handleActionResponse = (accepted, actionType) => {
    setPendingAction(null);

    if (accepted) {
      let response = '';
      switch (actionType) {
        case 'sales_improvement':
          response = `売上改善分析を実行します！

📊 **詳細分析結果**
- 最大の課題：4月の65%未達が全体を押し下げ
- 改善ポイント：既存顧客へのアップセル強化

🎯 **具体的改善策**
1. 高額商品の提案頻度を月5件→10件に倍増
2. 既存顧客向け限定キャンペーンの実施
3. 営業チーム向け高単価商談研修の開催

**予想効果**: 3ヶ月後に売上達成率95%到達見込み`;
          setShowAnalysis(true);
          break;
        case 'orders_improvement':
          response = `受注数改善の詳細分析を開始します！

📈 **ボトルネック分析**
- 商談→受注転換率：31.1%（目標35%）
- 最大課題：稟議段階での失注40%

🚀 **改善アクションプラン**
1. 初回商談で決裁者情報を必須ヒアリング
2. 稟議段階専用のフォローアップ資料作成
3. 週次の案件レビュー制度導入

**予想効果**: 受注率35%達成で月間受注数16.8件に向上`;
          setShowSimulation(true);
          break;
        case 'customer_optimization':
          response = `新規顧客獲得の更なる効率化を分析します！

✨ **現状の強み**
- 95%の高い達成率を維持
- 月間9件の安定した獲得

📈 **効率化提案**
1. 高品質リードの獲得チャネル強化
2. 新規顧客へのオンボーディング改善
3. 紹介プログラムの拡充

**予想効果**: 同じリソースで獲得数12件/月を目指せます`;
          break;
        case 'conversion_improvement':
          response = `受注率向上の包括的分析を実行します！

🔍 **プロセス分析**
- 見込み→提案：62%（良好）
- 提案→商談：64%（要改善）
- 商談→受注：44%（要改善）

💡 **段階別改善策**
1. 提案品質向上研修の実施
2. 商談時の課題ヒアリング強化
3. クロージング技術の標準化

**予想効果**: 全体受注率を35%まで向上可能`;
          setShowAnalysis(true);
          break;
        default:
          break;
      }

      const responseMessage = {
        id: messages.length + 1,
        type: 'ai',
        content: response
      };

      setMessages(prev => [...prev, responseMessage]);
    } else {
      const declineMessage = {
        id: messages.length + 1,
        type: 'ai',
        content: '承知いたしました。他にご質問や分析したい項目があれば、いつでもお声かけください！'
      };

      setMessages(prev => [...prev, declineMessage]);
    }
  };

  const simulateDataChange = () => {
    const improvedSalesData = salesData.map((item) => {
      if (item.month === '6月') {
        return {
          ...item,
          売上実績: 1450000,
          受注数: 22,
          新規顧客: 15
        };
      }
      return {
        ...item,
        売上実績: Math.min(item.売上実績 * 1.1, item.売上目標 * 1.05),
        受注数: Math.min(Math.round(item.受注数 * 1.08), item.受注目標 * 1.02)
      };
    });
    setSalesData(improvedSalesData);

    setTimeout(() => setAnimateChart(false), 3000);
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const newMessage = { id: messages.length + 1, type: 'user', content: inputValue };
    setMessages([...messages, newMessage]);

    const currentInput = inputValue;

    setTimeout(() => {
      let aiResponse = '';

      if (currentInput.includes('売上') && !currentInput.includes('目標')) {
        aiResponse = '売上データを分析しますね。6月の売上は98万円で、前月比-14.8%減となっています。4月の大幅未達が影響していますが、全体トレンドとしては回復基調です。';
        setActiveMetric('sales');
      } else if (currentInput.includes('顧客') || currentInput.includes('カスタマー')) {
        aiResponse = '顧客データを確認しました。新規顧客獲得は目標の95%と好調ですが、既存顧客のアップセル機会を逃している可能性があります。';
        setActiveMetric('customers');
      } else if (currentInput.includes('シミュレート') || currentInput.includes('変更')) {
        aiResponse = `データをシミュレートしてみますね！改善施策適用後の予測：

🚀 **劇的改善結果**
- 6月売上: 98万円 → 145万円（目標120万円を大幅超過！）
- 6月受注: 14件 → 22件（目標18件を大幅超過！）
- 全体達成率: 82% → 96%に向上`;
        setAnimateChart(true);
        setActiveMetric('sales');
        simulateDataChange();
      } else if (currentInput.includes('売上目標') || currentInput.includes('売上達成')) {
        aiResponse = `現在の売上達成率は82%で目標を下回っています。分析結果：

📊 **問題点**
- 4月と6月の大幅未達が影響（4月: 65%、6月: 82%）
- 新規顧客獲得は好調（95%達成）だが、既存顧客のアップセルが不足

💡 **改善提案**
1. 既存顧客への追加提案を強化（月5件→10件）
2. 4月型の失注要因を分析し、同様パターンを早期発見
3. 単価向上施策：平均受注額を10%アップ

**シミュレーション結果**: これらを実行すれば7月末には目標達成率95%到達見込み`;
        setActiveMetric('sales');
        setShowAnalysis(true);
      } else if (currentInput.includes('受注率') || currentInput.includes('受注目標')) {
        aiResponse = `受注率分析を実行しました：

📈 **現状分析**
- 受注率達成度: 78%（目標18件/月 vs 実績14件/月）
- コンバージョン率: 商談→受注 31.1%（業界平均35%を下回る）

🎯 **ボトルネック特定**
- 稟議段階での失注が最多（40%が稟議で停止）
- 決裁者との接触不足が主因

🚀 **アクションプラン**
1. 初回商談で決裁者情報を必須ヒアリング
2. 稟議段階で決裁者向け資料を別途作成
3. 週次フォローアップ体制を構築

**予測効果**: 受注率を35%まで改善すれば月間受注数が16.8件に向上`;
        setActiveMetric('conversion');
        setShowSimulation(true);
      } else if (currentInput.includes('営業効率') || currentInput.includes('効率化')) {
        aiResponse = `営業効率化の分析結果：

⚡ **効率性の課題**
- テレアポ→商談転換率: 14.1%（業界平均18%を下回る）
- 1件あたり商談時間: 平均2.3時間（長すぎ）
- 提案書作成時間: 平均4.5時間（非効率）

🚀 **効率化提案**
1. テレアポスクリプト最適化で転換率+4%向上
2. 商談テンプレート導入で時間30%短縮
3. 提案書自動化ツールで作成時間半減

**効果**: 同じ時間で商談数1.5倍、受注機会35%増加見込み`;
        setActiveMetric('orders');
        setShowAnalysis(true);
      } else if (currentInput.includes('テレアポ') || currentInput.includes('商談')) {
        aiResponse = '営業活動データを分析しました。テレアポは目標400件に対し320件（80%）、商談は目標50件に対し45件（90%）です。テレアポ数を増やすことで商談機会が拡大し、受注につながる可能性があります。';
        setActiveMetric('orders');
      } else if (currentInput.includes('パイプライン') || currentInput.includes('案件')) {
        aiResponse = 'セールスパイプラインを分析しました。現在、見込み45件→提案28件→商談18件→稟議12件→受注8件の流れです。特に稟議→受注の転換率が低く（67%）、ここが改善ポイントです。';
        setActiveMetric('conversion');
      } else if (currentInput.includes('新しい指標') || currentInput.includes('追加')) {
        aiResponse = '新しいKPI指標を追加しました！営業効率向上のための先行指標として「顧客エンゲージメントスコア」「リード品質指数」「営業サイクル短縮率」を表示します。';
        setShowNewMetrics(true);
        setShowAnalysis(true);
      } else {
        aiResponse = `「${currentInput}」について詳しく分析いたします。具体的な改善提案をお示しします。`;
      }

      setMessages(prev => [...prev, { id: prev.length + 1, type: 'ai', content: aiResponse }]);
    }, 1500);

    setInputValue('');
  };

  const MetricCard = ({ title, value, target, icon: Icon, trend, onClick, isActive, type = 'number' }) => {
    let achievementRate;
    if (type === 'percentage') {
      achievementRate = parseFloat(value.replace('%', ''));
    } else {
      const numericValue = parseFloat(value.replace(/[¥,件]/g, ''));
      const numericTarget = parseFloat(target.replace(/[¥,件]/g, ''));
      achievementRate = Math.round((numericValue / numericTarget) * 100);
    }

    if (isNaN(achievementRate)) {
      achievementRate = 0;
    }

    const statusColor = achievementRate >= 100 ? 'text-green-600' : achievementRate >= 80 ? 'text-yellow-600' : 'text-red-600';
    const StatusIcon = achievementRate >= 100 ? CheckCircle : achievementRate >= 80 ? AlertTriangle : TrendingDown;

    const isFocused = activeMetric && isActive;
    const isDimmed = activeMetric && !isActive;

    return (
      <div
        className={`bg-white rounded-lg p-6 shadow-sm border-2 transition-all cursor-pointer ${
          isFocused
            ? 'border-blue-500 bg-blue-50 opacity-100'
            : isDimmed
            ? 'border-gray-200 opacity-40 hover:opacity-60'
            : 'border-gray-200 hover:border-blue-300 opacity-100'
        }`}
        onClick={() => onClick && onClick(isActive ? null : undefined)}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <Icon className={`h-6 w-6 mr-3 ${isFocused ? 'text-blue-600' : 'text-gray-400'}`} />
            <p className="text-sm font-medium text-gray-600">{title}</p>
          </div>
          <StatusIcon className={`h-5 w-5 ${statusColor}`} />
        </div>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500">目標: {target}</p>
          </div>
          <div className="text-right">
            <p className={`text-lg font-semibold ${statusColor}`}>{achievementRate}%</p>
            {trend && (
              <div className="flex items-center text-sm text-gray-600">
                <TrendingUp className="h-4 w-4 mr-1" />
                {trend}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen w-full max-w-none bg-gray-100">
      {/* ダッシュボード部分 (左70%) */}
      <div className="w-[70%] p-6 overflow-y-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">営業パフォーマンス・ダッシュボード</h1>
          <p className="text-gray-600">AIによる目標達成分析と改善提案を含む統合営業管理システム</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-6 mb-6">
          <MetricCard
            title="月間売上"
            value="¥980,000"
            target="¥1,200,000"
            icon={DollarSign}
            trend="+5.2%"
            onClick={(reset) => handleMetricClick('sales', reset)}
            isActive={activeMetric === 'sales'}
          />
          <MetricCard
            title="受注数"
            value="14件"
            target="18件"
            icon={Target}
            trend="-2件"
            onClick={(reset) => handleMetricClick('orders', reset)}
            isActive={activeMetric === 'orders'}
          />
          <MetricCard
            title="新規顧客"
            value="9件"
            target="10件"
            icon={Users}
            trend="+1件"
            onClick={(reset) => handleMetricClick('customers', reset)}
            isActive={activeMetric === 'customers'}
          />
          <MetricCard
            title="受注率"
            value="31.1%"
            target="35%"
            icon={TrendingUp}
            trend="-3.9%"
            onClick={(reset) => handleMetricClick('conversion', reset)}
            isActive={activeMetric === 'conversion'}
            type="percentage"
          />
        </div>

        {/* メインチャート */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className={`col-span-2 bg-white rounded-lg p-6 shadow-sm border-2 transition-all ${
            activeMetric === 'sales'
              ? 'border-blue-500 opacity-100'
              : activeMetric && activeMetric !== 'sales'
              ? 'border-gray-200 opacity-40'
              : 'border-gray-200 opacity-100'
          }`}>
            <h3 className="text-lg font-semibold mb-4">売上実績 vs 目標 推移</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `¥${value.toLocaleString()}`} />
                <Line
                  type="monotone"
                  dataKey="売上目標"
                  stroke="#94a3b8"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  name="目標"
                />
                <Line
                  type="monotone"
                  dataKey="売上実績"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  name="実績"
                  className={animateChart ? 'animate-pulse' : ''}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className={`bg-white rounded-lg p-6 shadow-sm border-2 transition-all ${
            activeMetric
              ? 'border-gray-200 opacity-40'
              : 'border-gray-200 opacity-100'
          }`}>
            <h3 className="text-lg font-semibold mb-4">目標達成率</h3>
            <div className="space-y-4">
              {achievementData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.name}</span>
                  <div className="flex items-center">
                    <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                      <div
                        className="h-2 rounded-full transition-all duration-1000"
                        style={{
                          width: `${Math.min(item.value, 100)}%`,
                          backgroundColor: item.color
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold">{item.value}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 営業活動分析 */}
        <div className="grid grid-cols-2 gap-6 mb-3">
          <div className={`bg-white rounded-lg p-6 shadow-sm border-2 transition-all ${
            activeMetric === 'orders'
              ? 'border-blue-500 opacity-100'
              : activeMetric && activeMetric !== 'orders'
              ? 'border-gray-200 opacity-40'
              : 'border-gray-200 opacity-100'
          }`}>
            <h3 className="text-lg font-semibold mb-4">営業活動実績</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={activityData} margin={{ top: 5, right: 30, left: 20, bottom: 35 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="活動" angle={-45} textAnchor="end" height={35} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="今月" fill="#3b82f6" name="今月実績" />
                <Bar dataKey="目標" fill="#e5e7eb" name="目標" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className={`bg-white rounded-lg p-6 shadow-sm border-2 transition-all ${
            activeMetric === 'conversion'
              ? 'border-blue-500 opacity-100'
              : activeMetric && activeMetric !== 'conversion'
              ? 'border-gray-200 opacity-40'
              : 'border-gray-200 opacity-100'
          }`}>
            <h3 className="text-lg font-semibold mb-4">セールスパイプライン</h3>
            <div className="space-y-3">
              {pipelineData.map((stage, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3`}
                         style={{ backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#10b981'][index] }}>
                    </div>
                    <span className="text-sm font-medium">{stage.stage}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">{stage.count}件</div>
                    <div className="text-xs text-gray-500">¥{(stage.amount / 1000000).toFixed(1)}M</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 新しいメトリクス */}
        {showNewMetrics && (
          <div className="mb-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border-2 border-green-200">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Plus className="h-5 w-5 mr-2 text-green-600" />
              新しく追加された先行指標
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">78.5%</div>
                <div className="text-sm text-gray-600 mt-1">顧客エンゲージメント</div>
                <div className="text-xs text-gray-500 mt-1">前月比 +5.2%</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">8.7点</div>
                <div className="text-sm text-gray-600 mt-1">リード品質指数</div>
                <div className="text-xs text-gray-500 mt-1">10点満点中</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg border border-purple-200">
                <div className="text-2xl font-bold text-purple-600">23日</div>
                <div className="text-sm text-gray-600 mt-1">平均営業サイクル</div>
                <div className="text-xs text-gray-500 mt-1">前月比 -3日短縮</div>
              </div>
            </div>
          </div>
        )}

        {/* AI分析結果 */}
        {showAnalysis && (
          <div className="mb-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border-2 border-blue-200">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Zap className="h-5 w-5 mr-2 text-blue-600" />
              AI分析結果 & 改善提案
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-semibold text-red-600 mb-2">⚠️ 課題分析</h4>
                <ul className="text-sm space-y-1">
                  <li>• 4月売上大幅未達（65%）</li>
                  <li>• 稟議段階での失注多発</li>
                  <li>• 既存顧客アップセル不足</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-semibold text-blue-600 mb-2">📈 改善施策</h4>
                <ul className="text-sm space-y-1">
                  <li>• 決裁者早期接触強化</li>
                  <li>• 既存顧客深耕プログラム</li>
                  <li>• 週次案件レビュー制度</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-semibold text-green-600 mb-2">🎯 期待効果</h4>
                <ul className="text-sm space-y-1">
                  <li>• 売上達成率 +13%向上</li>
                  <li>• 受注率 +4%改善</li>
                  <li>• 3ヶ月後目標達成見込み</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* シミュレーション結果 */}
        {showSimulation && (
          <div className="mb-3 bg-green-50 rounded-lg p-6 border-2 border-green-200">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Target className="h-5 w-5 mr-2 text-green-600" />
              改善シミュレーション結果
            </h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="text-2xl font-bold text-green-600">95%</div>
                <div className="text-sm text-gray-600">予測売上達成率</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="text-2xl font-bold text-green-600">16.8件</div>
                <div className="text-sm text-gray-600">予測月間受注数</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="text-2xl font-bold text-green-600">35%</div>
                <div className="text-sm text-gray-600">改善後受注率</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="text-2xl font-bold text-green-600">+¥240万</div>
                <div className="text-sm text-gray-600">月間売上増加見込み</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AIチャット部分 (右30%) */}
      <div className="w-[30%] bg-white border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center">
            <MessageCircle className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">AI営業アドバイザー</h3>
              <p className="text-sm text-gray-600">目標達成のための戦略提案</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id}>
              <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {message.type === 'ai' && (
                    <Zap className="h-4 w-4 inline mr-2 text-blue-600" />
                  )}
                  <div className="whitespace-pre-line text-sm">{message.content}</div>
                </div>
              </div>

              {message.hasActions && pendingAction === message.actionType && (
                <div className="flex justify-start mt-2">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleActionResponse(true, message.actionType)}
                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded-full hover:bg-blue-700 transition-colors"
                    >
                      ✅ はい、お願いします
                    </button>
                    <button
                      onClick={() => handleActionResponse(false, message.actionType)}
                      className="px-3 py-1 bg-gray-400 text-white text-xs rounded-full hover:bg-gray-500 transition-colors"
                    >
                      ❌ いいえ、大丈夫です
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="p-4 border-t border-gray-200">
          <div className="flex space-x-2 mb-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="目標達成のための質問をどうぞ..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSendMessage}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setInputValue('売上データを分析して')}
              className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full transition-colors text-center"
            >
              📊 売上分析
            </button>
            <button
              onClick={() => setInputValue('顧客データを見せて')}
              className="px-2 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded-full transition-colors text-center"
            >
              👥 顧客分析
            </button>
            <button
              onClick={() => setInputValue('データをシミュレートして')}
              className="px-2 py-1 text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-full transition-colors text-center"
            >
              🎮 シミュレート
            </button>
            <button
              onClick={() => setInputValue('売上目標達成するためにどうすればいい？')}
              className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded-full transition-colors text-center"
            >
              🎯 売上目標達成
            </button>
            <button
              onClick={() => setInputValue('受注率を向上させる方法は？')}
              className="px-2 py-1 text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-full transition-colors text-center"
            >
              📈 受注率改善
            </button>
            <button
              onClick={() => setInputValue('営業効率を改善したい')}
              className="px-2 py-1 text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-full transition-colors text-center"
            >
              🚀 営業効率化
            </button>
            <button
              onClick={() => setInputValue('テレアポの効果を分析して')}
              className="px-2 py-1 text-xs bg-pink-100 hover:bg-pink-200 text-pink-700 rounded-full transition-colors text-center"
            >
              📞 テレアポ分析
            </button>
            <button
              onClick={() => setInputValue('パイプライン状況を教えて')}
              className="px-2 py-1 text-xs bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-full transition-colors text-center"
            >
              📋 パイプライン
            </button>
            <button
              onClick={() => setInputValue('新しい指標を追加して')}
              className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors text-center"
            >
              ➕ 指標追加
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CRMDashboard;
