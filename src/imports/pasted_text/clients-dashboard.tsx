
  // Inline sparkline helper
  const Sparkline = ({ data, color = "#4A6FA5" }: { data: number[], color?: string }) => {
    const w = 80, h = 32, pad = 2;
    const min = Math.min(...data), max = Math.max(...data);
    const range = max - min || 1;
    const pts = data
      .map((v, i) => {
        const x = pad + (i / (data.length - 1)) * (w - pad * 2);
        const y = h - pad - ((v - min) / range) * (h - pad * 2);
        return `${x},${y}`;
      })
      .join(" ");
    const area = `M${pts.split(" ")[0]} L${pts} L${w - pad},${h} L${pad},${h} Z`;
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
        <path d={`M${pts}`} stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
        <path d={area} fill={color} fillOpacity="0.08" />
      </svg>
    );
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[22px] text-[#1A2332]" style={{ fontWeight: 700 }}>Clients</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleCreateClient} className="bg-[#4A6FA5] hover:bg-[#3d5a85]">
            <span className="material-icons mr-2" style={{ fontSize: "20px" }}>add</span>
            New Client
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="px-4 py-2 border border-[#DDE3EE] rounded-lg bg-white text-[#546478] hover:bg-[#EDF0F5] transition-colors flex items-center gap-2">
                <span className="material-icons" style={{ fontSize: "18px" }}>more_horiz</span>
                More Actions
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
              <DropdownMenuItem className="cursor-pointer">
                <span className="material-icons mr-2" style={{ fontSize: "18px" }}>file_upload</span>
                Import
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <span className="material-icons mr-2" style={{ fontSize: "18px" }}>file_download</span>
                Export
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-5 mb-8">
    <Card className="p-4 border border-[#DDE3EE] bg-white hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[32px] mb-1 leading-none" style={{ fontWeight: 700, color: "#1A2332" }}>7</div>
          <div className="text-[14px] mb-1" style={{ fontWeight: 500, color: "#546478" }}>New clients</div>
          <div className="text-[12px] text-[#546478]">last 30 days</div>
          <div className="flex items-center gap-1 mt-2">
            <span className="text-[12px] text-[#16A34A] flex items-center gap-1" style={{ fontWeight: 500 }}>
              <span className="material-icons text-[16px] leading-none">trending_up</span>
              +16%
            </span>
            <span className="text-[12px] text-[#546478]">vs prev. period</span>
          </div>
        </div>
        <Sparkline data={[2, 3, 2, 5, 4, 6, 7]} color="#4A6FA5" />
      </div>
    </Card>

    <Card className="p-4 border border-[#DDE3EE] bg-white hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[32px] mb-1 leading-none" style={{ fontWeight: 700, color: "#1A2332" }}>23</div>
          <div className="text-[14px] mb-1" style={{ fontWeight: 500, color: "#546478" }}>Total clients</div>
          <div className="text-[12px] text-[#546478]">year to date</div>
          <div className="flex items-center gap-1 mt-2">
            <span className="text-[12px] text-[#16A34A] flex items-center gap-1" style={{ fontWeight: 500 }}>
              <span className="material-icons text-[16px] leading-none">trending_up</span>
              +43%
            </span>
            <span className="text-[12px] text-[#546478]">vs prev. year</span>
          </div>
        </div>
        <Sparkline data={[8, 10, 11, 14, 16, 20, 23]} color="#4A6FA5" />
      </div>
    </Card>

    <Card className="p-4 border border-[#DDE3EE] bg-white hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[32px] mb-1 leading-none" style={{ fontWeight: 700, color: "#1A2332" }}>$26.5k</div>
          <div className="text-[14px] mb-1" style={{ fontWeight: 500, color: "#546478" }}>Revenue from clients</div>
          <div className="text-[12px] text-[#546478]">last 30 days</div>
          <div className="flex items-center gap-1 mt-2">
            <span className="text-[12px] text-[#16A34A] flex items-center gap-1" style={{ fontWeight: 500 }}>
              <span className="material-icons text-[16px] leading-none">trending_up</span>
              +22%
            </span>
            <span className="text-[12px] text-[#546478]">vs prev. period</span>
          </div>
        </div>
        <Sparkline data={[12, 15, 14, 19, 22, 21, 26]} color="#4A6FA5" />
      </div>
    </Card>

    <Card className="p-4 border border-[#DDE3EE] bg-gradient-to-br from-[#1A2332] to-[#2a3a50] hover:shadow-sm transition-shadow cursor-pointer group">
      <div className="flex flex-col h-full justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "20px" }}>auto_awesome</span>
            <span className="text-[12px] text-[#4A6FA5] uppercase tracking-wide" style={{ fontWeight: 600 }}>What's New</span>
          </div>
          <div className="text-[14px] text-white mb-1" style={{ fontWeight: 600 }}>Integration with QuickBooks Online</div>
          <p className="text-[12px] text-[#8899AA] leading-relaxed">Sync your clients, invoices, and payments automatically.</p>
        </div>
        <div className="flex items-center gap-1 mt-3 text-[#4A6FA5] group-hover:text-[#6b8fc0] transition-colors">
          <span className="text-[12px]" style={{ fontWeight: 600 }}>Learn more</span>
          <span className="material-icons" style={{ fontSize: "16px" }}>arrow_forward</span>
        </div>
      </div>
    </Card>
  </div>
