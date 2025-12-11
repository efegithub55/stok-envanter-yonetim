// /assets/js/charts/stockValue.js
document.addEventListener("DOMContentLoaded", function () {
  const el = document.querySelector("#stockValueChart");
  if (!el || typeof ApexCharts === "undefined") return;

  const data = (window.REPORT_CHARTS && window.REPORT_CHARTS.stockValue) || {};
  const labels = data.labels || [];
  const values = data.values || [];

  if (!labels.length || !values.length) {
    el.innerHTML =
      "<div class='no-data'><img src='/assets/svg/no_data.svg' /></div>";
    return;
  }

  const options = {
    chart: {
      type: "area",
      height: 260,
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI'",
    },
    series: [
      {
        name: "Net Stok Değişimi",
        data: values,
      },
    ],
    dataLabels: { enabled: false },
    stroke: {
      curve: "smooth",
      width: 3,
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 0.7,
        opacityFrom: 0.4,
        opacityTo: 0.0,
        stops: [0, 50, 100],
      },
    },
    xaxis: {
      categories: labels,
      labels: {
        style: {
          fontSize: "11px",
        },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        formatter: function (val) {
          return "₺" + Number(val).toLocaleString("tr-TR");
        },
        style: { fontSize: "11px" },
      },
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return "₺" + Number(val).toLocaleString("tr-TR");
        },
      },
    },
    grid: {
      borderColor: "rgba(148, 163, 184, 0.25)",
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
    },
  };

  const chart = new ApexCharts(el, options);
  chart.render();
});
