import { BarChart } from "@mantine/charts";
import mantineChartsCss from "@mantine/charts/styles.css?url";
import { Paper, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { createFileRoute, notFound } from "@tanstack/react-router";

import { Notice } from "#/components/atoms/Notice";
import { formatBytes } from "#/lib/format.ts";
import { getPhotoStats } from "#/server/stats.ts";

const StatsPage = () => {
  const { cameras, focalLengths, hours, isoValues, lenses, months, overview } =
    Route.useLoaderData();

  if (overview.totalPhotos === 0) {
    return (
      <Stack p="xl" gap="md">
        <Title order={2}>統計</Title>
        <Notice>写真がまだありません</Notice>
      </Stack>
    );
  }

  const period =
    overview.earliest === null || overview.latest === null
      ? "撮影日時が未設定"
      : `${new Date(overview.earliest).toLocaleDateString("ja-JP")} 〜 ${new Date(overview.latest).toLocaleDateString("ja-JP")}`;
  const cards = [
    { label: "総枚数", value: `${overview.totalPhotos.toLocaleString()} 枚` },
    { label: "合計容量", value: formatBytes(overview.totalBytes) },
    { label: "撮影期間", value: period },
    { label: "位置情報あり", value: `${overview.geotagged.toLocaleString()} 枚` },
    { label: "キャプション未入力", value: `${overview.missingCaption.toLocaleString()} 枚` },
    { label: "代替テキスト未入力", value: `${overview.missingAlt.toLocaleString()} 枚` },
    {
      label: "アルバム",
      value: `${overview.totalAlbums} 個 / 公開 ${overview.publicAlbums} 個`,
    },
    { label: "アルバム未所属", value: `${overview.unfiledPhotos.toLocaleString()} 枚` },
  ];
  const columnCharts = [
    { data: months, title: "月別の枚数" },
    { data: hours, title: "時間帯別の枚数" },
    { data: focalLengths, title: "焦点距離" },
    { data: isoValues, title: "ISO 感度" },
  ];
  const barCharts = [
    { data: cameras, title: "カメラ別の枚数" },
    { data: lenses, title: "レンズ別の枚数" },
  ];

  return (
    <Stack p="xl" gap="xl">
      <Title order={2}>統計</Title>

      <SimpleGrid cols={{ base: 2, lg: 4, sm: 3 }} spacing="md">
        {cards.map((card) => (
          <Paper key={card.label} withBorder radius="md" p="md">
            <Text size="xs" c="dimmed">
              {card.label}
            </Text>
            <Text size="lg" fw={700}>
              {card.value}
            </Text>
          </Paper>
        ))}
      </SimpleGrid>

      {columnCharts.map((chart) =>
        chart.data.length === 0 ? null : (
          <Stack key={chart.title} gap="xs">
            <Title order={4}>{chart.title}</Title>
            <BarChart
              h={260}
              data={chart.data}
              dataKey="label"
              series={[{ color: "blue.6", label: "枚数", name: "count" }]}
              barProps={{ radius: 4 }}
              gridAxis="y"
              tickLine="none"
              unit=" 枚"
            />
          </Stack>
        ),
      )}

      {barCharts.map((chart) =>
        chart.data.length === 0 ? null : (
          <Stack key={chart.title} gap="xs">
            <Title order={4}>{chart.title}</Title>
            <BarChart
              h={40 * chart.data.length + 40}
              data={chart.data}
              dataKey="label"
              orientation="vertical"
              series={[{ color: "blue.6", label: "枚数", name: "count" }]}
              barProps={{ radius: 4 }}
              gridAxis="x"
              tickLine="none"
              yAxisProps={{ width: 160 }}
              unit=" 枚"
            />
          </Stack>
        ),
      )}
    </Stack>
  );
};

export const Route = createFileRoute("/admin/stats")({
  component: StatsPage,
  head: () => ({
    links: [{ href: mantineChartsCss, rel: "stylesheet" }],
    meta: [{ title: "統計 | photos.newt239.dev" }],
  }),
  loader: async () => {
    const result = await getPhotoStats();
    if (!result.success) {
      throw notFound();
    }
    return {
      cameras: result.cameras,
      focalLengths: result.focalLengths,
      hours: result.hours,
      isoValues: result.isoValues,
      lenses: result.lenses,
      months: result.months,
      overview: result.overview,
    };
  },
});
