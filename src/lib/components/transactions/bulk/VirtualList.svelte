<script>
	/**
	 * VirtualList - Composant de liste virtualisée pour performances optimales
	 * Ne rend que les éléments visibles à l'écran + un buffer
	 */
	import { onMount, tick } from 'svelte';

	let {
		items = [],
		itemHeight = 60,
		height = 600,
		overscan = 5,
		getItemHeight = null, // Fonction optionnelle pour hauteur dynamique
		children
	} = $props();

	// État du scroll
	let scrollTop = $state(0);
	let containerElement = $state(null);

	// Calculer les hauteurs
	let itemHeights = $derived.by(() => {
		if (getItemHeight) {
			return items.map((item, index) => getItemHeight(item, index));
		}
		return items.map(() => itemHeight);
	});

	let totalHeight = $derived(itemHeights.reduce((sum, h) => sum + h, 0));

	// Calculer les positions cumulées pour chaque item
	let itemPositions = $derived.by(() => {
		const positions = [0];
		for (let i = 0; i < itemHeights.length; i++) {
			positions.push(positions[i] + itemHeights[i]);
		}
		return positions;
	});

	// Calculer la plage visible
	let visibleRange = $derived.by(() => {
		const viewportTop = scrollTop;
		const viewportBottom = scrollTop + height;

		// Trouver le premier item visible (binary search pour performance)
		let startIndex = 0;
		let endIndex = items.length - 1;

		// Binary search pour startIndex
		while (startIndex < endIndex) {
			const mid = Math.floor((startIndex + endIndex) / 2);
			if (itemPositions[mid + 1] <= viewportTop) {
				startIndex = mid + 1;
			} else {
				endIndex = mid;
			}
		}

		// Trouver le dernier item visible
		let lastIndex = startIndex;
		while (
			lastIndex < items.length &&
			itemPositions[lastIndex] < viewportBottom
		) {
			lastIndex++;
		}

		// Ajouter overscan
		const start = Math.max(0, startIndex - overscan);
		const end = Math.min(items.length, lastIndex + overscan);

		return { start, end };
	});

	// Items visibles
	let visibleItems = $derived(
		items.slice(visibleRange.start, visibleRange.end).map((item, i) => ({
			item,
			index: visibleRange.start + i,
			top: itemPositions[visibleRange.start + i]
		}))
	);

	// Offset du container des items visibles
	let offsetY = $derived(itemPositions[visibleRange.start] || 0);

	function handleScroll(event) {
		scrollTop = event.target.scrollTop;
	}

	// Fonction pour scroller vers un item spécifique
	export function scrollToIndex(index, behavior = 'smooth') {
		if (containerElement && index >= 0 && index < items.length) {
			const targetTop = itemPositions[index];
			containerElement.scrollTo({
				top: targetTop,
				behavior
			});
		}
	}

	// Fonction pour obtenir l'index du premier item visible
	export function getFirstVisibleIndex() {
		return visibleRange.start;
	}
</script>

<div
	bind:this={containerElement}
	class="virtual-list-container"
	style="height: {height}px; overflow-y: auto;"
	onscroll={handleScroll}
>
	<div class="virtual-list-spacer" style="height: {totalHeight}px;">
		<div class="virtual-list-content" style="transform: translateY({offsetY}px);">
			{#each visibleItems as { item, index, top } (item.id || index)}
				{@render children(item, index)}
			{/each}
		</div>
	</div>
</div>

<style>
	.virtual-list-container {
		position: relative;
		overflow-y: auto;
		overflow-x: hidden;
		will-change: scroll-position;
	}

	.virtual-list-spacer {
		position: relative;
		width: 100%;
	}

	.virtual-list-content {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		will-change: transform;
	}

	/* Optimisations pour performance */
	.virtual-list-container {
		-webkit-overflow-scrolling: touch;
	}

	/* Scrollbar styling */
	.virtual-list-container::-webkit-scrollbar {
		width: 12px;
	}

	.virtual-list-container::-webkit-scrollbar-track {
		background: #f1f1f1;
	}

	.virtual-list-container::-webkit-scrollbar-thumb {
		background: #888;
		border-radius: 6px;
	}

	.virtual-list-container::-webkit-scrollbar-thumb:hover {
		background: #555;
	}
</style>
