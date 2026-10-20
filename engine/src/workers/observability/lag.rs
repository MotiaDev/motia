// Copyright Motia LLC and/or licensed to Motia LLC under one or more
// contributor license agreements. Licensed under the Elastic License 2.0;
// you may not use this file except in compliance with the Elastic License 2.0.
// This software is patent protected. We welcome discussions - reach out at team@iii.dev
// See LICENSE and PATENTS files for details.

//! Reporting that a consumer of the log broadcast fell behind.
//!
//! A consumer of the engine's log channel must not log every lag. The report
//! is a log line itself: it lands in the same full channel, evicts the message
//! the consumer was about to read, and the consumer lags again, by one, and
//! reports again. One burst of logs (a thousand workers disconnecting at
//! `info`) then keeps a core busy and the log growing for as long as the engine
//! runs. [`LagReport`] reports at most once per [`LAG_REPORT_INTERVAL`], so the
//! consumer catches up between two reports.

use std::time::{Duration, Instant};

/// The shortest time between two lag reports of one consumer.
pub(crate) const LAG_REPORT_INTERVAL: Duration = Duration::from_secs(10);

/// The messages a consumer skipped since it last said so.
#[derive(Debug, Default)]
pub(crate) struct LagReport {
    skipped: u64,
    last: Option<Instant>,
}

impl LagReport {
    /// Records `skipped` messages. Returns how many to report now (those and
    /// any held back since the last report), or `None` while the last report
    /// is more recent than [`LAG_REPORT_INTERVAL`].
    pub(crate) fn lagged(&mut self, skipped: u64) -> Option<u64> {
        self.lagged_at(skipped, Instant::now())
    }

    fn lagged_at(&mut self, skipped: u64, now: Instant) -> Option<u64> {
        self.skipped = self.skipped.saturating_add(skipped);
        if self
            .last
            .is_some_and(|last| now.duration_since(last) < LAG_REPORT_INTERVAL)
        {
            return None;
        }
        self.last = Some(now);
        Some(std::mem::take(&mut self.skipped))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tokio::sync::broadcast::{self, error::TryRecvError};

    #[test]
    fn lags_are_reported_once_per_interval_with_what_was_held_back() {
        let t0 = Instant::now();
        let mut report = LagReport::default();
        assert_eq!(report.lagged_at(3, t0), Some(3));
        assert_eq!(report.lagged_at(1, t0 + Duration::from_secs(1)), None);
        assert_eq!(report.lagged_at(2, t0 + Duration::from_secs(9)), None);
        assert_eq!(
            report.lagged_at(1, t0 + LAG_REPORT_INTERVAL + Duration::from_secs(1)),
            Some(4)
        );
    }

    /// The consumer of a full channel, reporting each lag into that same
    /// channel the way a `tracing::warn!` lands in the log broadcast. Returns
    /// how many messages it received and how many reports it sent.
    fn consume(mut report: impl FnMut(u64) -> bool) -> (u32, u32) {
        let (tx, mut rx) = broadcast::channel::<u32>(4);
        // A burst: the consumer is now behind.
        for i in 0..16 {
            tx.send(i).unwrap();
        }
        let (mut received, mut reports) = (0, 0);
        for _ in 0..10_000 {
            match rx.try_recv() {
                Ok(_) => received += 1,
                Err(TryRecvError::Lagged(n)) => {
                    if report(n) {
                        reports += 1;
                        tx.send(u32::MAX).unwrap();
                    }
                }
                Err(TryRecvError::Empty) => break,
                Err(TryRecvError::Closed) => unreachable!(),
            }
        }
        (received, reports)
    }

    #[test]
    fn reporting_every_lag_into_the_lagging_channel_never_catches_up() {
        // What the subscribers did: each report evicts the next message.
        let (received, reports) = consume(|_| true);
        assert_eq!(received, 0);
        assert_eq!(reports, 10_000);
    }

    #[test]
    fn a_rate_limited_report_lets_the_consumer_catch_up() {
        let mut report = LagReport::default();
        let (received, reports) = consume(|n| report.lagged(n).is_some());
        assert_eq!(reports, 1);
        // The channel's whole backlog, the report included.
        assert_eq!(received, 4);
    }
}
