import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MLTLeaderboardRewards() {
  const topMLTs = [
    { rank: 1, name: 'S. Rajesh (You)', samples: 142, rating: 4.98, reward: '₹2,500 Bonus', isUser: true },
    { rank: 2, name: 'P. Priya Devi', samples: 138, rating: 4.96, reward: '₹1,500 Bonus', isUser: false },
    { rank: 3, name: 'M. Ramesh Naik', samples: 129, rating: 4.94, reward: '₹1,000 Bonus', isUser: false },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 16 }}>🏆</Text>
          <Text style={styles.title}>PHLEBOTOMY CHAMPIONS LEADERBOARD</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>WEEK 33</Text>
        </View>
      </View>

      <Text style={styles.subtitle}>
        Top performers earn weekly instant cash incentives & Platinum First-Stick Badges.
      </Text>

      {/* Leaderboard Table */}
      <View style={styles.table}>
        {topMLTs.map((mlt) => (
          <View key={mlt.rank} style={[styles.row, mlt.isUser && styles.userRow]}>
            <View style={styles.rankBox}>
              <Text style={styles.rankText}>
                {mlt.rank === 1 ? '🥇' : mlt.rank === 2 ? '🥈' : '🥉'} #{mlt.rank}
              </Text>
            </View>

            <View style={styles.nameBox}>
              <Text style={[styles.nameText, mlt.isUser && { color: '#34d399', fontWeight: '900' }]}>
                {mlt.name}
              </Text>
              <Text style={styles.statText}>
                {mlt.samples} Samples • ⭐ {mlt.rating}
              </Text>
            </View>

            <View style={styles.rewardBox}>
              <Text style={styles.rewardText}>{mlt.reward}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 10,
    fontWeight: '900',
    color: '#cbd5e1',
    letterSpacing: 0.5,
  },
  badge: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 10,
    color: '#94a3b8',
    marginBottom: 12,
  },
  table: {
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  userRow: {
    backgroundColor: '#062d22',
    borderColor: '#059669',
  },
  rankBox: {
    width: 42,
  },
  rankText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  nameBox: {
    flex: 1,
  },
  nameText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  statText: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 1,
  },
  rewardBox: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rewardText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#38bdf8',
  },
});
